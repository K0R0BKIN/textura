import { createTRPCRouter } from '../init';
import { searchRouter } from './search';

export const appRouter = createTRPCRouter({
  search: searchRouter,
});

export type AppRouter = typeof appRouter;
