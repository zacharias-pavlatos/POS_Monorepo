import { restaurantRepository } from '@repo/db/repositories';

import { organizationProcedure } from '../procedures.js';

const restaurantRouter = {
  get: organizationProcedure.restaurant.get.handler(async ({ context, errors }) => {
    const restaurant = await restaurantRepository({
      db: context.db,
      organizationId: context.activeOrganizationId,
    }).find();

    if (!restaurant) {
      throw errors.NOT_FOUND({
        message: 'Restaurant not configured for this organization',
      });
    }
    return restaurant;
  }),

  create: organizationProcedure.restaurant.create.handler(
    async ({ context, input, errors }) => {
      const isExisting = await restaurantRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).find();

      if (isExisting) {
        throw errors.CONFLICT({
          message: 'Restaurant already exists for this organization',
        });
      }

      const res = await restaurantRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).create(input);

      if (!res) {
        throw errors.BAD_REQUEST({
          message: 'Failed to create restaurant',
        });
      }
      return res;
    }
  ),

  update: organizationProcedure.restaurant.update.handler(
    async ({ context, input, errors }) => {
      const updated = await restaurantRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).update(input);

      if (!updated) {
        throw errors.NOT_FOUND({
          message: 'Restaurant not configured for this organization',
        });
      }
      return updated;
    }
  ),
};

export default restaurantRouter;
