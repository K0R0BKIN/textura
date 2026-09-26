import { findArticle } from '@/lib/articles';
import { cacheHeaders } from '@/lib/http';
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
    return Response.json(null, { headers: cacheHeaders });
  }

  return Response.json(await findArticle(parsedHeadword.data), {
    headers: cacheHeaders,
  });
}
