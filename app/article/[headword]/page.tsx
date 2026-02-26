type Props = {
  params: Promise<{ headword: string }>;
};

export default async function ArticlePage({ params }: Props) {
  const { headword } = await params;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-24">
      <h1 className="font-serif text-4xl">{decodeURIComponent(headword)}</h1>
    </div>
  );
}
