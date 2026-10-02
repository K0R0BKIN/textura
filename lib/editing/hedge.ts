import 'server-only';

import type OpenAI from 'openai';

// Hedged requests, from "The Tail at Scale": when a request is slower than
// usual, send a duplicate and use whichever answers first. A request that
// hangs then costs a couple of seconds instead of a full timeout, and only
// the rare slow request is sent twice.

// How often hedges were sent, for measuring.
export const hedgeStats = { requests: 0, hedged: 0 };

// Runs `request`, and runs it again if the first hasn't settled after
// `after` ms. Resolves with the first success; rejects only if both fail.
export function hedged<T>(request: () => Promise<T>, after: number) {
  hedgeStats.requests++;
  return new Promise<T>((resolve, reject) => {
    let running = 0;
    let settled = false;
    let lastError: unknown;
    const run = () => {
      running++;
      request().then(
        (value) => {
          settled = true;
          clearTimeout(timer);
          resolve(value);
        },
        (error: unknown) => {
          running--;
          lastError = error;
          if (settled) return;
          // The first failed early: send the duplicate now instead of waiting.
          if (timer !== undefined) hedge();
          else if (running === 0) reject(lastError);
        },
      );
    };
    let timer: NodeJS.Timeout | undefined = setTimeout(() => hedge(), after);
    const hedge = () => {
      clearTimeout(timer);
      timer = undefined;
      if (settled) return;
      hedgeStats.hedged++;
      run();
    };
    run();
  });
}

type ResponseStream = ReturnType<OpenAI['responses']['stream']>;

// Streams a response, and starts a duplicate if no text has arrived after
// `after` ms. The first stream to produce text wins; the other is aborted.
// Once text is flowing, the winner can't be switched, so later stalls are
// the caller's to handle.
export function hedgedStream(
  create: () => ResponseStream,
  after: number,
  handlers: {
    // Text from the winning stream.
    onDelta: (delta: string) => void;
    // Any event from a stream still in the running, to detect stalls.
    onEvent: () => void;
  },
) {
  hedgeStats.requests++;
  const streams: ResponseStream[] = [];
  let winner: ResponseStream | undefined;
  let failures = 0;
  let resolveEnded!: (ok: boolean) => void;
  // Whether the winning response completed; false if it or every stream
  // failed.
  const ended = new Promise<boolean>((resolve) => (resolveEnded = resolve));

  const start = () => {
    const stream = create();
    streams.push(stream);
    stream.on('event', () => {
      if (!winner || winner === stream) handlers.onEvent();
    });
    stream.on('response.output_text.delta', ({ delta }) => {
      if (!winner) {
        winner = stream;
        clearTimeout(timer);
        timer = undefined;
        for (const other of streams) if (other !== stream) other.abort();
      }
      if (winner === stream) handlers.onDelta(delta);
    });
    stream.finalResponse().then(
      () => {
        if (winner === stream) resolveEnded(true);
      },
      () => {
        failures++;
        if (winner === stream) resolveEnded(false);
        else if (!winner) {
          // The first failed before any text: send the duplicate now.
          if (timer !== undefined) hedge();
          else if (failures === streams.length) resolveEnded(false);
        }
      },
    );
  };
  let timer: NodeJS.Timeout | undefined = setTimeout(() => hedge(), after);
  const hedge = () => {
    clearTimeout(timer);
    timer = undefined;
    if (winner) return;
    hedgeStats.hedged++;
    start();
  };
  start();

  return {
    ended,
    abort() {
      clearTimeout(timer);
      for (const stream of streams) stream.abort();
    },
  };
}
