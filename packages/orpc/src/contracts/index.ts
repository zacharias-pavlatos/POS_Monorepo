import { oc } from '@orpc/contract';
import type {
  InferContractRouterInputs,
  InferContractRouterOutputs,
} from '@orpc/contract';

import restaurantContract from './restaurants';
import workstationContract from './workstations';
import catalogContract from './catalogs';
import categoryContract from './categories';
import productContract from './products';
import modifierGroupContract from './modifier-groups';
import modifierContract from './modifiers';
import modifierDependencyContract from './modifier-dependencies';
import offerContract from './offers';

export const appContract = oc
  .errors({
    INPUT_VALIDATION_FAILED: {
      status: 422,
    },
    BAD_REQUEST: {
      status: 400,
      message: 'Invalid request',
    },
    UNAUTHORIZED: {
      status: 401,
      message: 'Missing user session. Please log in!',
    },
    FORBIDDEN: {
      status: 403,
      message: 'You do not have enough permission to perform this action.',
    },
    NOT_FOUND: {
      status: 404,
      message: 'Resource not found',
    },
    CONFLICT: {
      status: 409,
      message: 'Resource already exists',
    },
  })
  .router({
    restaurant: restaurantContract,
    workstations: workstationContract,
    catalogs: catalogContract,
    categories: categoryContract,
    products: productContract,
    modifierGroups: modifierGroupContract,
    modifiers: modifierContract,
    modifierDependencies: modifierDependencyContract,
    offers: offerContract,
  });

// ---------------------------------------------------------------------------
// Inferred types — frontend imports these, never touches @repo/db
// ---------------------------------------------------------------------------

export type AppContractInputs = InferContractRouterInputs<typeof appContract>;
export type AppContractOutputs = InferContractRouterOutputs<typeof appContract>;

// ---------------------------------------------------------------------------
// Re-export Zod schemas for form resolvers (zodResolver needs the runtime schema)
// ---------------------------------------------------------------------------

export {
  InsertWorkStationSchema,
  type InsertWorkStationInputType,
  PatchWorkStationSchema,
  type PatchWorkStationInputType,
  SelectWorkStationSchema,
  type SelectWorkStationType,
} from '@repo/db/schema';

export {
  InsertCatalogSchema,
  type InsertCatalogInputType,
  PatchCatalogSchema,
  type PatchCatalogInputType,
  SelectCatalogSchema,
  type SelectCatalogType,
} from '@repo/db/schema';

export {
  InsertCategorySchema,
  type InsertCategoryInputType,
  PatchCategorySchema,
  type PatchCategoryInputType,
  SelectCategorySchema,
  type SelectCategoryType,
} from '@repo/db/schema';

export {
  InsertProductSchema,
  type InsertProductInputType,
  PatchProductSchema,
  type PatchProductInputType,
  SelectProductSchema,
  type SelectProductType,
} from '@repo/db/schema';

export {
  InsertModifierGroupSchema,
  type InsertModifierGroupInputType,
  PatchModifierGroupSchema,
  type PatchModifierGroupInputType,
  SelectModifierGroupSchema,
  type SelectModifierGroupType,
} from '@repo/db/schema';

export {
  InsertModifierSchema,
  type InsertModifierInputType,
  PatchModifierSchema,
  type PatchModifierInputType,
  SelectModifierSchema,
  type SelectModifierType,
} from '@repo/db/schema';

export {
  InsertModifierOptionDependencySchema,
  type InsertModifierOptionDependencyInputType,
  PatchModifierOptionDependencySchema,
  type PatchModifierOptionDependencyInputType,
  SelectModifierOptionDependencySchema,
  type SelectModifierOptionDependencyType,
} from '@repo/db/schema';

export {
  InsertOfferSchema,
  type InsertOfferInputType,
  PatchOfferSchema,
  type PatchOfferInputType,
  SelectOfferSchema,
  type SelectOfferType,
} from '@repo/db/schema';
