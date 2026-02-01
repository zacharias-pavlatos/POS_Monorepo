import { productRepository } from '@repo/db/repositories';

import { organizationProcedure } from '../procedures.js';

const productRouter = {
  all: organizationProcedure.products.all.handler(({ context }) => {
    return productRepository({
      db: context.db,
      organizationId: context.activeOrganizationId,
    }).findAll();
  }),

  one: organizationProcedure.products.one.handler(
    async ({ context, input, errors }) => {
      const dbProduct = await productRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).findById(input.id);

      if (!dbProduct) {
        throw errors.NOT_FOUND({
          data: {
            productId: input.id,
          },
        });
      }
      return dbProduct;
    }
  ),

  create: organizationProcedure.products.create.handler(
    async ({ context, input, errors }) => {
      const res = await productRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).create(input);
      if (!res) {
        throw errors.BAD_REQUEST({
          message: 'Failed to create product',
        });
      }
      return res;
    }
  ),

  update: organizationProcedure.products.update.handler(
    async ({ context, input, errors }) => {
      const { id, ...data } = input;
      const updated = await productRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).update(id, data);

      if (!updated) {
        throw errors.NOT_FOUND({
          data: {
            productId: input.id,
          },
        });
      }

      return updated;
    }
  ),

  delete: organizationProcedure.products.delete.handler(
    async ({ context, input, errors }) => {
      const res = await productRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).delete(input.id);

      if (!res) {
        throw errors.NOT_FOUND({
          data: {
            productId: input.id,
          },
        });
      }
      return res;
    }
  ),
};

export default productRouter;
