import { Suspense } from 'react';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';

async function SearchResults({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  return (
    <Empty className="border-none">
      <EmptyHeader>
        <EmptyTitle>No results</EmptyTitle>
        <EmptyDescription>
          Textura doesn&apos;t know what &ldquo;{q}&rdquo; means. Sorry.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <Suspense>
      <SearchResults searchParams={searchParams} />
    </Suspense>
  );
}
