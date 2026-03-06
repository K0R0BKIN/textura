'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command, CommandDialog, CommandInput } from '@/components/ui/command';

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  function navigate() {
    const term = query.trim();
    if (term) {
      router.push('/article/' + encodeURIComponent(term));
      setOpen(false);
      setQuery('');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') navigate();
  }

  return (
    <CommandDialog open={open} onOpenChange={(open) => setOpen(open)}>
      <Command className="overflow-visible">
        <CommandInput
          placeholder="Look up definitions…"
          value={query}
          onValueChange={setQuery}
          onKeyDown={handleKeyDown}
          onSubmit={navigate}
          submitDisabled={!query.trim()}
        />
      </Command>
    </CommandDialog>
  );
}
