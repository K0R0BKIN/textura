import { findArticle, generateArticle } from '@/lib/articles';
import { SupportedHeadwordSchema } from '@/lib/headwords';
import { HeadwordSchema, slugToVariety } from '@/lib/schemas';

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ headword: string; variety: string }>;
  },
) {
  const { headword, variety } = await params;

  const parsedVariety = slugToVariety.safeParse(variety);

  if (!parsedVariety.success) {
    return Response.json(null, { status: 404 });
  }

  const parsedHeadword = HeadwordSchema.safeParse({
    form: decodeURIComponent(headword),
    variety: parsedVariety.data,
  });

  if (!parsedHeadword.success) {
    return Response.json(null);
  }

  const existing = await findArticle(parsedHeadword.data);

  if (existing) {
    return Response.json(existing);
  }

  const supportedHeadword = await SupportedHeadwordSchema.safeParseAsync(
    parsedHeadword.data,
  );

  if (!supportedHeadword.success) {
    return Response.json(null);
  }

  const article = await generateArticle(supportedHeadword.data);

  if (!article) {
    throw new Error(
      `Failed to generate article for "${supportedHeadword.data.form}"`,
    );
  }

  return Response.json(article);
}
