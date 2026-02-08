import restaurantRouter from './restaurant';
import workstationRouter from './workstation';
import catalogRouter from './catalog';
import categoryRouter from './category';
import productRouter from './product';
import modifierGroupRouter from './modifier-group';
import modifierRouter from './modifier';
import modifierDependencyRouter from './modifier-dependency';
import offerRouter from './offer';

export const appRouter = {
  restaurant: restaurantRouter,
  workstations: workstationRouter,
  catalogs: catalogRouter,
  categories: categoryRouter,
  products: productRouter,
  modifierGroups: modifierGroupRouter,
  modifiers: modifierRouter,
  modifierDependencies: modifierDependencyRouter,
  offers: offerRouter,
};

export type AppRouter = typeof appRouter;
