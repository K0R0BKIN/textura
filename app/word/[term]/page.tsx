type Props = {
  params: Promise<{ term: string }>;
};

export default async function WordPage({ params }: Props) {
  const { term } = await params;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-24">
      <h1 className="font-serif text-4xl">{decodeURIComponent(term)}</h1>
    </div>
  );
}
