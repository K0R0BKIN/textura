'use server';

import { redirect } from 'next/navigation';
import { validateQuery } from '@/lib/validation';

export async function triage(_: unknown, formData: FormData) {
  const query = formData.get('query') as string;

  if (await validateQuery(query, 'en-US')) {
    redirect(`/dictionary/${encodeURIComponent(query)}/en-us`);
  } else {
    redirect(`/search?q=${encodeURIComponent(query)}`);
  }
}
