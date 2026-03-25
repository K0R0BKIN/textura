'use server';

import { redirect } from 'next/navigation';
import { validateQuery } from '@/lib/validation';

export async function triage(_: unknown, formData: FormData) {
  const query = formData.get('query') as string;

  const result = await validateQuery(query, 'en-US');

  if (result.valid) {
    redirect(`/dictionary/${encodeURIComponent(query)}/en-us`);
  }

  return { ...result, query };
}
