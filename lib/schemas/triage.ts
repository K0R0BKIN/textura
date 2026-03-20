import { z } from 'zod';

export const TriageResultSchema = z.object({
  valid: z.boolean(),
});
export type TriageResult = z.infer<typeof TriageResultSchema>;
