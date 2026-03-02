import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { generateArticle } from '@/lib/ai';

function ArticleSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-12 w-48 rounded bg-muted" />
      <div className="h-5 w-32 rounded bg-muted" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-3/4 rounded bg-muted" />
      </div>
    </div>
  );
}

async function ArticleContent({ headword }: { headword: Promise<string> }) {
  const article = await generateArticle(await headword);

  if (!article) notFound();

  const showSuperscript = article.etymons.length > 1;

  return (
    <>
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
          {etymon.lexemes.map((lexeme, lexemeIndex) => (
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
                  <li key={senseIndex}>{sense.definition}</li>
                ))}
              </ol>
            </div>
          ))}
        </section>
      ))}
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
    <div className="mx-auto max-w-2xl px-4 py-24">
      <Suspense fallback={<ArticleSkeleton />}>
        <ArticleContent headword={headword} />
      </Suspense>
    </div>
  );
}
