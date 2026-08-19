import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Article } from './article';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ headword: string; variety: string }>;
}): Promise<Metadata> {
  const { headword } = await params;

  return {
    title: decodeURIComponent(headword),
  };
}

export default function ArticlePage() {
  return (
    <Suspense fallback={null}>
      <Article />
    </Suspense>
  );
}
