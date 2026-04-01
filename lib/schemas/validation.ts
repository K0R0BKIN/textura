import { z } from 'zod';

export const QueryValidationResultSchema = z.object({
  valid: z.boolean(),
});
