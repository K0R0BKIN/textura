type Props = {
  params: Promise<{ word: string }>;
};

export default async function WordPage({ params }: Props) {
  const { word } = await params;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-24">
      <h1 className="font-serif text-4xl">{decodeURIComponent(word)}</h1>
    </div>
  );
}
