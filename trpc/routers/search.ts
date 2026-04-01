import { z } from 'zod';
import { QueryValidationResultSchema } from '@/lib/schemas';
import { validateQuery } from '@/lib/validation';
import { baseProcedure, createTRPCRouter } from '../init';

export const searchRouter = createTRPCRouter({
  validateQuery: baseProcedure
    .input(z.object({ query: z.string() }))
    .output(QueryValidationResultSchema.extend({ query: z.string() }))
    .mutation(async ({ input }) => {
      const result = await validateQuery(input.query, 'en-US');
      return { ...result, query: input.query };
    }),
});
