import { notFound } from 'next/navigation';
import { generateArticle } from '@/lib/ai';

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ headword: string }>;
}) {
  const { headword } = await params;
  const article = await generateArticle(decodeURIComponent(headword));

  if (!article) notFound();

  const showSuperscript = article.etymons.length > 1;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-24">
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
                <span className="font-semibold">{lexeme.lexicalCategory}</span>
                <span className="ml-2 text-muted-foreground">
                  {lexeme.pronunciation}
                </span>
              </h3>
              <ol className="mt-2 list-[bare-decimal] space-y-2 pl-0 marker:text-muted-foreground">
                {lexeme.senses.map((sense, senseIndex) => (
                  <li key={senseIndex}>{sense.definition}</li>
                ))}
              </ol>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
