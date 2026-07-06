export default function DictionaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex min-h-svh flex-col px-4">{children}</div>;
}
