'use server';

import { redirect } from 'next/navigation';
import { validateHeadword } from '@/lib/validation';

export async function triage(_: unknown, formData: FormData) {
  const query = formData.get('query') as string;

  if (await validateHeadword(query, 'en-US')) {
    redirect(`/dictionary/${encodeURIComponent(query)}/en-us`);
  } else {
    redirect(`/search?q=${encodeURIComponent(query)}`);
  }
}
