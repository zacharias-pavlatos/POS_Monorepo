/**
 * /restaurant (singular — 1:1 with organization)
 *
 * No list endpoint: each organization has exactly one restaurant.
 * No {id} in paths: the restaurant is identified by the org context.
 * No delete: removing the restaurant would break the organization.
 */

import { oc } from '@orpc/contract';

import {
  InsertRestaurantSchema,
  PatchRestaurantSchema,
  SelectRestaurantSchema,
} from '@repo/db/schema';

const restaurantContract = oc
  .prefix('/restaurant')
  .tag('restaurant')
  .router({
    get: oc
      .route({
        method: 'GET',
        path: '/',
        summary: 'Get restaurant details',
        description:
          'Returns the restaurant for the current organization. Every organization has exactly one restaurant.',
      })
      .output(SelectRestaurantSchema),

    create: oc
      .route({
        method: 'POST',
        path: '/',
        summary: 'Create restaurant',
        description:
          'Creates the restaurant record for the current organization. Can only be called once per organization.',
      })
      .input(InsertRestaurantSchema)
      .output(SelectRestaurantSchema),

    update: oc
      .route({
        method: 'PATCH',
        path: '/',
        summary: 'Update restaurant',
        description:
          'Partially updates the restaurant. Only provided fields will be modified.',
      })
      .input(PatchRestaurantSchema)
      .output(SelectRestaurantSchema),
  });

export default restaurantContract;
