import { oc } from '@orpc/contract';

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
