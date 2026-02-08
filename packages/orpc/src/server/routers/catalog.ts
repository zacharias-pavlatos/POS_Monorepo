import { catalogRepository } from '@repo/db/repositories';

import { organizationProcedure } from '../procedures.js';

const catalogRouter = {
  all: organizationProcedure.catalogs.all.handler(({ context }) => {
    return catalogRepository({
      db: context.db,
      organizationId: context.activeOrganizationId,
    }).findAll();
  }),

  one: organizationProcedure.catalogs.one.handler(async ({ context, input, errors }) => {
    const catalog = await catalogRepository({
      db: context.db,
      organizationId: context.activeOrganizationId,
    }).findById(input.id);

    if (!catalog) {
      throw errors.NOT_FOUND({
        data: { catalogId: input.id },
      });
    }
    return catalog;
  }),

  /** GET /catalogs/{id}/categories — catalog with populated categories */
  categories: organizationProcedure.catalogs.categories.handler(
    async ({ context, input, errors }) => {
      const catalog = await catalogRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).findByIdWithCategories(input.id);

      if (!catalog) {
        throw errors.NOT_FOUND({
          data: { catalogId: input.id },
        });
      }
      return catalog;
    }
  ),

  create: organizationProcedure.catalogs.create.handler(
    async ({ context, input, errors }) => {
      const res = await catalogRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).create(input);

      if (!res) {
        throw errors.BAD_REQUEST({
          message: 'Failed to create catalog',
        });
      }
      return res;
    }
  ),

  update: organizationProcedure.catalogs.update.handler(
    async ({ context, input, errors }) => {
      const { id, ...data } = input;
      const updated = await catalogRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).update(id, data);

      if (!updated) {
        throw errors.NOT_FOUND({
          data: { catalogId: input.id },
        });
      }
      return updated;
    }
  ),

  delete: organizationProcedure.catalogs.delete.handler(
    async ({ context, input, errors }) => {
      const res = await catalogRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).hardDelete(input.id);

      if (!res) {
        throw errors.NOT_FOUND({
          data: { catalogId: input.id },
        });
      }
      return res;
    }
  ),
};

export default catalogRouter;
