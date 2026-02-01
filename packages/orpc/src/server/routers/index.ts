import categoryRouter from './category.js';
import productRouter from './product.js';

export const appRouter = {
  categories: categoryRouter,
  products: productRouter,
};

export type AppRouter = typeof appRouter;
