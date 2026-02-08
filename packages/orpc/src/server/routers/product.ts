import { productRepository } from '@repo/db/repositories';

import { organizationProcedure } from '../procedures.js';

const productRouter = {
  all: organizationProcedure.products.all.handler(({ context }) => {
    return productRepository({
      db: context.db,
      organizationId: context.activeOrganizationId,
    }).findAll();
  }),

  search: organizationProcedure.products.search.handler(({ context, input }) => {
    return productRepository({
      db: context.db,
      organizationId: context.activeOrganizationId,
    }).searchByName(input.query);
  }),

  one: organizationProcedure.products.one.handler(async ({ context, input, errors }) => {
    const product = await productRepository({
      db: context.db,
      organizationId: context.activeOrganizationId,
    }).findById(input.id);

    if (!product) {
      throw errors.NOT_FOUND({
        data: { productId: input.id },
      });
    }
    return product;
  }),

  /** GET /products/{id}/modifiers — product with modifier groups and options */
  oneWithModifiers: organizationProcedure.products.oneWithModifiers.handler(
    async ({ context, input, errors }) => {
      const product = await productRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).findByIdWithModifiers(input.id);

      if (!product) {
        throw errors.NOT_FOUND({
          data: { productId: input.id },
        });
      }
      return product;
    }
  ),

  /** GET /products/{id}/detailed — full tree with workstation, categories, modifiers, offers */
  oneDetailed: organizationProcedure.products.oneDetailed.handler(
    async ({ context, input, errors }) => {
      const product = await productRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).findByIdDetailed(input.id);

      if (!product) {
        throw errors.NOT_FOUND({
          data: { productId: input.id },
        });
      }
      return product;
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
          data: { productId: input.id },
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
      }).hardDelete(input.id);

      if (!res) {
        throw errors.NOT_FOUND({
          data: { productId: input.id },
        });
      }
      return res;
    }
  ),
};

export default productRouter;
