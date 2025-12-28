import categoryRouter from './category.js';

export const appRouter = {
  categories: categoryRouter,
};

export type AppRouter = typeof appRouter;
