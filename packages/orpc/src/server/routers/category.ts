import { categoryRepository } from '@repo/db/repositories';

import { organizationProcedure } from '../procedures.js';

const categoryRouter = {
  all: organizationProcedure.categories.all.handler(({ context }) => {
    return categoryRepository({
      db: context.db,
      organizationId: context.activeOrganizationId,
    }).findAll();
  }),

  byCatalog: organizationProcedure.categories.byCatalog.handler(({ context, input }) => {
    return categoryRepository({
      db: context.db,
      organizationId: context.activeOrganizationId,
    }).findByCatalog(input.catalogId);
  }),

  one: organizationProcedure.categories.one.handler(
    async ({ context, input, errors }) => {
      const category = await categoryRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).findById(input.id);

      if (!category) {
        throw errors.NOT_FOUND({
          data: { categoryId: input.id },
        });
      }
      return category;
    }
  ),

  /** GET /categories/{id}/products — category with linked products */
  oneWithProducts: organizationProcedure.categories.oneWithProducts.handler(
    async ({ context, input, errors }) => {
      const category = await categoryRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).findByIdWithProducts(input.id);

      if (!category) {
        throw errors.NOT_FOUND({
          data: { categoryId: input.id },
        });
      }
      return category;
    }
  ),

  /** GET /categories/{id}/full — deep expansion for POS checkout */
  oneDetailed: organizationProcedure.categories.oneDetailed.handler(
    async ({ context, input, errors }) => {
      const category = await categoryRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).findByIdDetailed(input.id);

      if (!category) {
        throw errors.NOT_FOUND({
          data: { categoryId: input.id },
        });
      }
      return category;
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
          data: { categoryId: input.id },
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
      }).hardDelete(input.id);

      if (!res) {
        throw errors.NOT_FOUND({
          data: { categoryId: input.id },
        });
      }
      return res;
    }
  ),

  // ─── Junction: Category ↔ Products ─────────────────────────────────

  addProduct: organizationProcedure.categories.addProduct.handler(
    async ({ context, input, errors }) => {
      const repo = categoryRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      });

      const category = await repo.findById(input.categoryId);
      if (!category) {
        throw errors.NOT_FOUND({
          data: { categoryId: input.categoryId },
        });
      }

      const res = await repo.addProduct(input);
      if (!res) {
        throw errors.CONFLICT({
          message: 'Product already linked to this category',
        });
      }
      return res;
    }
  ),

  removeProduct: organizationProcedure.categories.removeProduct.handler(
    async ({ context, input, errors }) => {
      const res = await categoryRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).removeProduct(input.categoryId, input.productId);

      if (!res) {
        throw errors.NOT_FOUND({
          message: 'Product not linked to this category',
        });
      }
      return res;
    }
  ),

  updateProductOrder: organizationProcedure.categories.updateProductOrder.handler(
    async ({ context, input, errors }) => {
      const res = await categoryRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).updateProductOrder(input.categoryId, input.productId, input.displayOrder);

      if (!res) {
        throw errors.NOT_FOUND({
          message: 'Product not linked to this category',
        });
      }
      return res;
    }
  ),
};

export default categoryRouter;
