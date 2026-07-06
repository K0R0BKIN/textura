import { ViewTransition } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <ViewTransition exit="skeleton-reveal-exit">
      <div className="mx-auto w-full max-w-2xl space-y-4 pt-26">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-5 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </ViewTransition>
  );
}
