'use client';

import { use } from 'react';
import Link from 'next/link';
import { useDictionary } from '@/hooks/useDictionary';
import { SearchBox } from '@/components/SearchBox';
import { LanguageToggle } from '@/components/LanguageToggle';
import { TOC } from '@/components/TOC';
import { EntryContent } from '@/components/EntryContent';
import { Sidebar } from '@/components/Sidebar';

interface PageProps {
  params: Promise<{ query: string }>;
}

export default function WordPage({ params }: PageProps) {
  const { query } = use(params);
  const decodedQuery = decodeURIComponent(query);
  const { data, loading, error, notFound } = useDictionary(decodedQuery);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border-subtle bg-bg-primary sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center gap-6">
          <Link href="/" className="font-serif text-2xl text-text-primary hover:text-accent transition-colors">
            Textura
          </Link>
          <SearchBox variant="topbar" initialQuery={decodedQuery} />
          <LanguageToggle />
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent/20 border-t-accent mb-4"></div>
              <p className="font-serif text-text-secondary">Loading...</p>
            </div>
          </div>
        )}

        {error && !notFound && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <h2 className="font-serif text-3xl text-text-primary mb-4">
                Something went wrong
              </h2>
              <p className="font-serif text-text-secondary mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-accent text-white rounded-lg font-sans hover:bg-accent/90 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {notFound && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <h2 className="font-serif text-3xl text-text-primary mb-4">
                Word not found
              </h2>
              <p className="font-serif text-text-secondary mb-6">
                We couldn't find "{decodedQuery}" in the dictionary.
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-accent text-white rounded-lg font-sans hover:bg-accent/90 transition-colors"
              >
                Search again
              </Link>
            </div>
          </div>
        )}

        {data && !loading && !error && (
          <>
            {/* Left: TOC */}
            <div className="w-64 shrink-0">
              <TOC headword={data} />
            </div>

            {/* Middle: Content */}
            <div className="flex-1 min-w-0">
              <EntryContent headword={data} />
            </div>

            {/* Right: Sidebar */}
            <div className="w-80 shrink-0">
              <Sidebar />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
