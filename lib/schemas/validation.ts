import { z } from 'zod';

export const QueryValidationSchema = z.object({
  valid: z.boolean(),
});
export type QueryValidation = z.infer<typeof QueryValidationSchema>;
