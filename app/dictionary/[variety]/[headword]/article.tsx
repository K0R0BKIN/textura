'use client';

import { useParams } from 'next/navigation';
import { useSpinDelay } from 'spin-delay';
import useSWRImmutable from 'swr/immutable';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { RecentEntryTracker } from '@/features/recent-entries/recent-entry-tracker';
import { HeadwordSchema, type Article } from '@/lib/schemas';

async function fetchArticle(url: string): Promise<Article | null> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load article (${response.status})`);
  }

  return response.json();
}

function ArticleSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 pt-26">
      <Skeleton className="h-12 w-48" />
      <Skeleton className="h-5 w-32" />

      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

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

export function Article() {
  const params = useParams<{
    headword: string;
    variety: string;
  }>();

  const {
    data: article,
    error,
    isLoading,
  } = useSWRImmutable(
    `/api/articles/${params.variety}/${encodeURIComponent(params.headword)}`,
    fetchArticle,
  );

  const showSkeleton = useSpinDelay(isLoading, {
    delay: 120,
    minDuration: 380,
    ssr: false,
  });

  if (error) throw error;
  if (showSkeleton) return <ArticleSkeleton />;
  if (article === null) return <ArticleNotFound />;
  if (!article) return null;

  const headword = HeadwordSchema.parse({
    form: article.headword,
    variety: article.variety,
  });

  const showSuperscript = article.etymons.length > 1;

  return (
    <>
      <article className="mx-auto w-full max-w-2xl py-26">
        <h1 className="sr-only">{article.headword}</h1>

        {article.etymons.map((etymon, etymonIndex) => (
          <section key={etymonIndex} className={etymonIndex > 0 ? 'mt-12' : ''}>
            <h2 className="font-serif text-5xl font-semibold tracking-tight [font-variation-settings:'opsz'_16]">
              {article.headword}
              {showSuperscript && (
                <sup className="text-subtle-foreground select-none">
                  {etymonIndex + 1}
                </sup>
              )}
            </h2>

            <p className="mt-2 font-serif text-muted-foreground">
              {etymon.origin}
            </p>

            {etymon.lexemes?.map((lexeme, lexemeIndex) => (
              <div
                key={lexemeIndex}
                className={lexemeIndex === 0 ? 'mt-4' : 'mt-8'}
              >
                <h3 className="text-lg text-subtle-foreground">
                  <span className="font-semibold select-none">
                    {lexeme.lexicalCategory}
                  </span>

                  <span className="ml-2 text-muted-foreground before:content-['/'] after:content-['/']">
                    {lexeme.transcription}
                  </span>
                </h3>

                <ol className="mt-2 list-[bare-decimal] space-y-2 pl-[calc(1ch+0.5em)] marker:text-muted-foreground">
                  {lexeme.senses.map((sense, senseIndex) => (
                    <li key={senseIndex} className="font-serif">
                      <span className="font-medium">
                        {sense.definition}
                        <span className="text-muted-foreground">:</span>
                      </span>

                      <span className="ml-1 text-muted-foreground italic">
                        {sense.example}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </section>
        ))}
      </article>

      <RecentEntryTracker headword={headword} />
    </>
  );
}
