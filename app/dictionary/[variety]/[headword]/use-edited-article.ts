'use client';

import { useEffect, useRef, useState } from 'react';

import type { EditedArticle, EditStreamMessage } from '@/lib/schemas';

// Loads an edited article. A saved article arrives as JSON; a first view
// streams in, and its text is revealed in order, top to bottom: an item only
// starts once everything before it is fully shown.

// Reveal pacing: at least minCharsPerFrame, plus a share of whatever is
// buffered, so buffered text catches up very fast but still visibly streams.
const minCharsPerFrame = 6;
const catchUpPerFrame = 0.2;

export type EditedArticleState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error' }
  | {
      status: 'streaming' | 'done';
      article: EditedArticle;
      // Revealed text per item id; an item is visible once it has any.
      revealed: Record<string, string>;
      // Items whose text is final and fully revealed.
      complete: Set<string>;
      // Whether the reveal is waiting for more text from the network.
      waiting: boolean;
    };

function fullText(article: EditedArticle) {
  const text: Record<string, string> = {};
  const visit = (
    senses: EditedArticle['etymons'][number]['lexemes'][number]['senses'],
  ) => {
    for (const sense of senses) {
      text[sense.id] = sense.definition;
      visit(sense.subsenses);
    }
  };
  for (const etymon of article.etymons) {
    if (etymon.originId) text[etymon.originId] = etymon.origin ?? '';
    for (const lexeme of etymon.lexemes) visit(lexeme.senses);
  }
  return text;
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useEditedArticle(url: string) {
  const [state, setState] = useState<EditedArticleState>({
    status: 'loading',
  });
  const [attempt, setAttempt] = useState(0);
  const received = useRef<Record<string, string>>({});
  const ended = useRef(new Set<string>());

  useEffect(() => {
    const abort = new AbortController();
    let frame = 0;
    let article: EditedArticle | undefined;
    let order: string[] = [];
    let finished = false;
    const shown: Record<string, number> = {};
    let lastKey = '';
    received.current = {};
    ended.current = new Set();

    const reveal = () => {
      if (!article) return;
      const pending = order.reduce(
        (n, id) => n + (received.current[id]?.length ?? 0) - (shown[id] ?? 0),
        0,
      );
      let budget = prefersReducedMotion()
        ? Infinity
        : Math.max(minCharsPerFrame, Math.ceil(pending * catchUpPerFrame));

      for (const id of order) {
        const text = received.current[id] ?? '';
        let at = shown[id] ?? 0;
        if (at < text.length && budget > 0) {
          // Advance by the budget, then to the end of the current word.
          let next = Math.min(text.length, at + budget);
          const space = text.indexOf(' ', next);
          next =
            space === -1 ? (ended.current.has(id) ? text.length : next) : space;
          budget -= next - at;
          at = next;
          shown[id] = at;
        }
        if (at < text.length || !ended.current.has(id)) break;
      }

      // Skip re-rendering while waiting on the network.
      const key = `${order.map((id) => shown[id] ?? 0).join()}|${ended.current.size}|${finished}`;
      if (key === lastKey) {
        frame = requestAnimationFrame(reveal);
        return;
      }
      lastKey = key;

      const revealed: Record<string, string> = {};
      const complete = new Set<string>();
      for (const id of order) {
        const text = received.current[id] ?? '';
        if (shown[id]) revealed[id] = text.slice(0, shown[id]);
        if (ended.current.has(id) && shown[id] === text.length) {
          complete.add(id);
        }
      }
      const done = finished && complete.size === order.length;
      setState({
        status: done ? 'done' : 'streaming',
        article,
        revealed,
        complete,
        waiting: !done && pending === 0,
      });
      if (!done) frame = requestAnimationFrame(reveal);
    };

    const handle = (message: EditStreamMessage) => {
      switch (message.type) {
        case 'outline':
          article = message.article;
          order = message.order;
          frame = requestAnimationFrame(reveal);
          break;
        case 'text':
          received.current[message.id] =
            (received.current[message.id] ?? '') + message.text;
          break;
        case 'end':
          ended.current.add(message.id);
          break;
        case 'done':
          finished = true;
          break;
        case 'error':
          throw new Error(message.message);
      }
    };

    (async () => {
      const response = await fetch(url, { signal: abort.signal });
      if (!response.ok) throw new Error(`Failed to load (${response.status})`);

      if (response.headers.get('content-type')?.includes('application/json')) {
        const saved: EditedArticle | null = await response.json();
        if (!saved) {
          setState({ status: 'not-found' });
          return;
        }
        const text = fullText(saved);
        setState({
          status: 'done',
          article: saved,
          revealed: text,
          complete: new Set(Object.keys(text)),
          waiting: false,
        });
        return;
      }

      setState({ status: 'loading' });
      const reader = response
        .body!.pipeThrough(new TextDecoderStream())
        .getReader();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) if (line) handle(JSON.parse(line));
      }
      if (!finished) throw new Error('The stream ended early');
    })().catch((error: unknown) => {
      if (abort.signal.aborted) return;
      console.error(error);
      cancelAnimationFrame(frame);
      setState({ status: 'error' });
    });

    return () => {
      abort.abort();
      cancelAnimationFrame(frame);
    };
  }, [url, attempt]);

  // Text received so far, for hidden senses expanded before their turn.
  const receivedText = (id: string) => received.current[id] ?? '';
  const retry = () => setAttempt((n) => n + 1);

  return { state, receivedText, retry };
}
