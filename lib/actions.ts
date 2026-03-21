'use server';

import { redirect } from 'next/navigation';
import { articleExists } from '@/lib/articles';
import { validateHeadword } from '@/lib/validation';

export async function triage(initialState: unknown, formData: FormData) {
  const query = formData.get('query') as string;
  const dictionaryPath = `/dictionary/${encodeURIComponent(query)}/en-us`;

  if (await articleExists(query, 'en-US')) {
    redirect(dictionaryPath);
  }

  const result = await validateHeadword(query, 'en-US');

  if (result?.valid) {
    redirect(dictionaryPath);
  } else {
    redirect(`/search?q=${encodeURIComponent(query)}`);
  }
}
