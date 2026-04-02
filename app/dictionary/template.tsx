import { Suspense } from 'react';
import { SearchBox } from '@/components/search-box';

export default function DictionaryTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <div className="fixed inset-x-0 bottom-0">
        <div className="mx-auto w-fit bg-background pb-3">
          <Suspense>
            <SearchBox variant="command" />
          </Suspense>
        </div>
      </div>
    </>
  );
}
