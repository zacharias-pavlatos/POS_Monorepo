import { categoryRepository } from '@repo/db/repositories';

import { organizationProcedure } from '../procedures.js';

const categoryRouter = {
  all: organizationProcedure.categories.all.handler(({ context }) => {
    return categoryRepository({
      db: context.db,
      organizationId: context.activeOrganizationId,
    }).findAll();
  }),

  one: organizationProcedure.categories.one.handler(
    async ({ context, input, errors }) => {
      const dbCategory = await categoryRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).findById(input.id);

      if (!dbCategory) {
        throw errors.NOT_FOUND({
          data: {
            categoryId: input.id,
          },
        });
      }
      return dbCategory;
    }
  ),

  create: organizationProcedure.categories.create.handler(
    async ({ context, input, errors }) => {
      const res = await categoryRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).create(input);
      if (!res) {
        throw errors.BAD_REQUEST({
          message: 'Failed to create category',
        });
      }
      return res;
    }
  ),

  update: organizationProcedure.categories.update.handler(
    async ({ context, input, errors }) => {
      const { id, ...data } = input;
      const updated = await categoryRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).update(id, data);

      if (!updated) {
        throw errors.NOT_FOUND({
          data: {
            categoryId: input.id,
          },
        });
      }

      return updated;
    }
  ),

  delete: organizationProcedure.categories.delete.handler(
    async ({ context, input, errors }) => {
      const res = await categoryRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).delete(input.id);

      if (!res) {
        throw errors.NOT_FOUND({
          data: {
            categoryId: input.id,
          },
        });
      }
      return res;
    }
  ),
};

export default categoryRouter;
