'use server';

import { redirect } from 'next/navigation';
import { dictionaryPath } from '@/lib/dictionary/routes';
import { validateQuery } from '@/lib/validation';

export async function triage(_: unknown, formData: FormData) {
  const query = formData.get('query') as string;

  const result = await validateQuery(query, 'en-US');

  if (result.valid) {
    redirect(dictionaryPath(query));
  }

  return { ...result, query };
}
