export default function ArticleLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-24">
      <div className="animate-pulse space-y-4">
        <div className="h-12 w-48 rounded bg-muted" />
        <div className="h-5 w-32 rounded bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-3/4 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
