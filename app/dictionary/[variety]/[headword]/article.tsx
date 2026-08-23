'use client';

import { useParams } from 'next/navigation';
import ContentLoader from 'react-content-loader';
import { useSpinDelay } from 'spin-delay';
import useSWRImmutable from 'swr/immutable';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
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
    <div className="mx-auto w-full max-w-2xl pt-26">
      <ContentLoader
        width="100%"
        height={140}
        speed={1.8}
        backgroundColor="var(--muted)"
        foregroundColor="light-dark(var(--brand-4), var(--gray-3))"
      >
        <rect x="0" y="0" width="192" height="48" rx="10" />
        <rect x="0" y="64" width="128" height="20" rx="10" />
        <rect x="0" y="100" width="100%" height="16" rx="10" />
        <rect x="0" y="124" width="75%" height="16" rx="10" />
      </ContentLoader>
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
    delay: 500,
    minDuration: 200,
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
