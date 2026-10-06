'use client';

import { useParams } from 'next/navigation';
import { Fragment } from 'react';
import { useDocumentTitle } from 'usehooks-ts';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import type { EditedArticle, EditedSense } from '@/lib/schemas';
import { cn } from '@/lib/utils';
import { useEditedArticle } from './use-edited-article';

type Reveal = {
  revealed: Record<string, string>;
  complete: Set<string>;
};

function ArticleNotFound() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>No article found</EmptyTitle>
        <EmptyDescription>Try searching for something else.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function Headword({ headword, index }: { headword: string; index?: number }) {
  return (
    <h2 className="font-serif text-5xl font-semibold tracking-tight [font-variation-settings:'opsz'_16]">
      {headword}
      {index !== undefined && (
        <sup className="text-subtle-foreground select-none">{index}</sup>
      )}
    </h2>
  );
}

// Appears only if nothing new has shown up for a moment.
function StreamingIndicator() {
  return (
    <div
      aria-hidden
      className="stream-indicator mt-3 h-3 w-16 rounded-full bg-muted"
    />
  );
}

function flatten(senses: EditedSense[]): EditedSense[] {
  return senses.flatMap((sense) => [sense, ...flatten(sense.subsenses)]);
}

const senseListStyles = [
  'list-[bare-decimal]',
  'list-[bare-lower-alpha]',
  'list-[bare-lower-roman]',
];

function Senses({
  senses,
  reveal,
  depth = 0,
  className,
}: {
  senses: EditedSense[];
  reveal: Reveal;
  depth?: number;
  className?: string;
}) {
  // Senses appear as their text streams in.
  const visible = senses.filter((sense) => sense.id in reveal.revealed);
  if (visible.length === 0) return null;

  return (
    <ol
      className={cn(
        senseListStyles[Math.min(depth, senseListStyles.length - 1)],
        'space-y-2 pl-[calc(1ch+0.5em)] marker:text-muted-foreground',
        className,
      )}
    >
      {visible.map((sense) => {
        const text = reveal.revealed[sense.id];
        const complete = reveal.complete.has(sense.id);
        return (
          <li key={sense.id} className="font-serif">
            <p className="font-medium">
              {/* Wiktionary's labels, before the definition as Oxford shows them. */}
              {sense.labels.length > 0 && (
                <span className="mr-1.5 font-normal text-muted-foreground italic">
                  {sense.labels.join(', ')}
                </span>
              )}
              {text || <span className="text-muted-foreground">…</span>}
            </p>

            {complete &&
              sense.examples.map((example, index) => (
                <p key={index} className="text-muted-foreground italic">
                  {example}
                </p>
              ))}

            <Senses
              senses={sense.subsenses}
              reveal={reveal}
              depth={depth + 1}
              className="mt-2"
            />
          </li>
        );
      })}
    </ol>
  );
}

// The article as blocks in reading order: each etymon's origin, then each
// part of speech with its senses. A block appears only once the block
// before it is complete, so the article grows top to bottom without holes.
function EditedArticleView({
  article,
  reveal,
  streaming,
  waiting,
}: {
  article: EditedArticle;
  reveal: Reveal;
  streaming: boolean;
  waiting: boolean;
}) {
  type Block = { key: string; ids: string[] };
  const blocks: Block[] = article.etymons.flatMap((etymon, e) => [
    ...(etymon.originId
      ? [{ key: `${e}:origin`, ids: [etymon.originId] }]
      : []),
    ...etymon.lexemes.map((lexeme, l) => ({
      key: `${e}:${l}`,
      ids: flatten(lexeme.senses).map((sense) => sense.id),
    })),
  ]);
  const isComplete = (block: Block) =>
    block.ids.every((id) => reveal.complete.has(id));
  const visibleBlocks = new Set<string>();
  for (const [index, block] of blocks.entries()) {
    const previousComplete = index === 0 || isComplete(blocks[index - 1]);
    const started = block.ids.length === 0 || block.ids[0] in reveal.revealed;
    if (!previousComplete || !started) break;
    visibleBlocks.add(block.key);
  }

  const showSuperscript = article.etymons.length > 1;

  return (
    <>
      {article.etymons.map((etymon, e) => {
        const firstBlock = etymon.originId ? `${e}:origin` : `${e}:0`;
        if (e > 0 && !visibleBlocks.has(firstBlock)) return null;

        return (
          <section key={e} className={e > 0 ? 'mt-12' : ''}>
            <Headword
              headword={article.headword}
              index={showSuperscript ? e + 1 : undefined}
            />

            {/* Empty when none of its sentences could be verified. */}
            {etymon.originId &&
              visibleBlocks.has(`${e}:origin`) &&
              reveal.revealed[etymon.originId] && (
                <p className="mt-2 font-serif whitespace-pre-line text-muted-foreground">
                  <Italicized text={reveal.revealed[etymon.originId] ?? ''} />
                </p>
              )}

            {etymon.lexemes.map((lexeme, l) => {
              const key = `${e}:${l}`;
              if (!visibleBlocks.has(key)) return null;

              return (
                <div key={l} className={l === 0 ? 'mt-4' : 'mt-8'}>
                  <h3 className="text-lg text-subtle-foreground">
                    <span className="font-semibold select-none">
                      {lexeme.lexicalCategory}
                    </span>

                    {lexeme.transcription && (
                      <span className="ml-2 text-muted-foreground before:content-['/'] after:content-['/']">
                        {lexeme.transcription}
                      </span>
                    )}
                  </h3>

                  <Senses
                    senses={lexeme.senses}
                    reveal={reveal}
                    className="mt-2"
                  />
                </div>
              );
            })}
          </section>
        );
      })}

      {streaming && waiting && <StreamingIndicator />}
    </>
  );
}

export function Article() {
  const params = useParams<{
    headword: string;
    variety: string;
  }>();
  const headword = decodeURIComponent(params.headword);

  useDocumentTitle(headword);

  const { state, retry } = useEditedArticle(
    `/api/articles/${params.variety}/${encodeURIComponent(headword)}`,
  );

  if (state.status === 'not-found') return <ArticleNotFound />;

  return (
    <article className="mx-auto w-full max-w-2xl py-26">
      <h1 className="sr-only">{headword}</h1>

      {state.status === 'streaming' || state.status === 'done' ? (
        <EditedArticleView
          article={state.article}
          reveal={{
            revealed: state.revealed,
            complete: state.complete,
          }}
          streaming={state.status === 'streaming'}
          waiting={state.waiting}
        />
      ) : (
        <section>
          <Headword headword={headword} />

          {state.status === 'loading' && <StreamingIndicator />}

          {state.status === 'error' && (
            <p className="mt-4 text-muted-foreground">
              This article couldn’t be loaded.{' '}
              <button
                type="button"
                className="underline hover:text-foreground"
                onClick={retry}
              >
                Try again
              </button>
            </p>
          )}
        </section>
      )}
    </article>
  );
}

// Renders the *asterisk* spans that origins use for cited words and titles in
// italics. While text streams in, an unclosed span is italic up to the end,
// so an asterisk never shows.
function Italicized({ text }: { text: string }) {
  return text
    .split('*')
    .map((part, i) =>
      i % 2 === 1 ? (
        <em key={i}>{part}</em>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      ),
    );
}
