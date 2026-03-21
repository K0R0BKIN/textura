'use server';

import { redirect } from 'next/navigation';
import { triageQuery } from '@/lib/queries';

export async function triage(initialState: unknown, formData: FormData) {
  const query = formData.get('query') as string;
  const result = await triageQuery(query, 'en-US');

  if (result?.valid) {
    redirect(`/dictionary/${encodeURIComponent(query)}/en-us`);
  } else {
    redirect(`/search?q=${encodeURIComponent(query)}`);
  }
}
