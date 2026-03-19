import { z } from 'zod';

export const VarietySchema = z.enum(['en-US']);
export type Variety = z.infer<typeof VarietySchema>;

export const VARIETY_BY_SLUG: Record<string, Variety> = {
  'en-us': 'en-US',
};
