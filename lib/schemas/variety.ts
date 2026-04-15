import { z } from 'zod';

export const VarietySchema = z.enum(['en-US']);
export type Variety = z.infer<typeof VarietySchema>;

export const slugToVariety = z.codec(z.literal('en-us'), VarietySchema, {
  decode: (): Variety => 'en-US',
  encode: (): 'en-us' => 'en-us',
});
