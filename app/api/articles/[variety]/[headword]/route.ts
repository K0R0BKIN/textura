import { generateArticle } from '@/lib/articles';
import { SupportedHeadwordSchema } from '@/lib/headwords';
import { slugToVariety } from '@/lib/schemas';

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

  const parsedHeadword = await SupportedHeadwordSchema.safeParseAsync({
    form: decodeURIComponent(headword),
    variety: parsedVariety.data,
  });

  if (!parsedHeadword.success) {
    return Response.json(null);
  }

  const article = await generateArticle(parsedHeadword.data);

  if (!article) {
    throw new Error(
      `Failed to generate article for "${parsedHeadword.data.form}"`,
    );
  }

  return Response.json(article);
}
