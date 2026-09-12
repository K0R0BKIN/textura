import type { Metadata } from 'next';
import { connection } from 'next/server';
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

async function DynamicMarker() {
  await connection();

  return null;
}

export default function ArticlePage() {
  return (
    <>
      <Suspense>
        <DynamicMarker />
      </Suspense>

      <Suspense fallback={null}>
        <Article />
      </Suspense>
    </>
  );
}
