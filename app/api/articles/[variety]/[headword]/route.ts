import { findArticle, findEditedArticle, findPhrases } from '@/lib/articles';
import { streamEdit } from '@/lib/editing/stream-edit';
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

  // Both at once: the raw article is needed whenever no edit is saved yet.
  // REGENERATE_ARTICLES=1 ignores saved edits, to test editing changes.
  const [edited, article, phrases] = await Promise.all([
    process.env.REGENERATE_ARTICLES === '1'
      ? null
      : findEditedArticle(parsedHeadword.data),
    findArticle(parsedHeadword.data),
    findPhrases(parsedHeadword.data),
  ]);

  if (edited) {
    return Response.json(edited, { headers: cacheHeaders });
  }

  if (!article) {
    return Response.json(null, { headers: cacheHeaders });
  }

  return streamEdit(article, phrases);
}
