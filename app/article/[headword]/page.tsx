import type { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { generateArticle } from '@/lib/ai';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ headword: string }>;
}): Promise<Metadata> {
  const { headword } = await params;

  return {
    title: decodeURIComponent(headword),
  };
}

function ArticleSkeleton() {
  return (
    <div className="col-start-2 animate-pulse space-y-4">
      <div className="h-12 w-48 rounded bg-muted" />
      <div className="h-5 w-32 rounded bg-muted" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-3/4 rounded bg-muted" />
      </div>
    </div>
  );
}

const ILLUSTRATIONS: Record<string, string> = {
  rose: '/illustrations/rose.png',
};

async function ArticleContent({ headword }: { headword: Promise<string> }) {
  const article = await generateArticle(await headword);

  if (!article) notFound();

  const showSuperscript = article.etymons.length > 1;
  const illustration = ILLUSTRATIONS[article.headword.toLowerCase()];

  return (
    <>
      <main className="col-start-2">
        <h1 className="sr-only">{article.headword}</h1>
        {article.etymons.map((etymon, etymonIndex) => (
          <section key={etymonIndex} className={etymonIndex > 0 ? 'mt-12' : ''}>
            <h2 className="font-serif text-5xl font-semibold tracking-tight">
              {article.headword}
              {showSuperscript && (
                <sup className="text-secondary-foreground select-none">
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
                <h3 className="text-lg text-secondary-foreground">
                  <span className="font-semibold select-none">
                    {lexeme.lexicalCategory}
                  </span>
                  <span className="ml-2 text-muted-foreground before:content-['/'] after:content-['/']">
                    {lexeme.pronunciation}
                  </span>
                </h3>
                <ol className="mt-2 list-[bare-decimal] space-y-2 pl-[calc(1ch+0.5em)] marker:text-muted-foreground">
                  {lexeme.senses.map((sense, senseIndex) => (
                    <li key={senseIndex} className="font-serif">
                      <span className="font-medium">{sense.definition}</span>
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
      </main>
      <aside className="col-start-3">
        {illustration && (
          <Image
            src={illustration}
            alt=""
            width={1024}
            height={1024}
            unoptimized
            className="h-auto w-full max-w-lg min-w-xs dark:invert"
          />
        )}
      </aside>
    </>
  );
}

export default function ArticlePage({
  params,
}: {
  params: Promise<{ headword: string }>;
}) {
  const headword = params.then((p) => decodeURIComponent(p.headword));

  return (
    <div className="grid grid-cols-[1fr_minmax(0,42rem)_1fr] gap-x-12 py-24">
      <Suspense fallback={<ArticleSkeleton />}>
        <ArticleContent headword={headword} />
      </Suspense>
    </div>
  );
}
