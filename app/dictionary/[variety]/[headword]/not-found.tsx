import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';

export default function NotFound() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>No article found</EmptyTitle>
        <EmptyDescription>Try searching for something else.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
