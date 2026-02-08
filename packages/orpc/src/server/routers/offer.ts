import { offerRepository } from '@repo/db/repositories';

import { organizationProcedure } from '../procedures.js';

const offerRouter = {
  all: organizationProcedure.offers.all.handler(({ context }) => {
    return offerRepository({
      db: context.db,
      organizationId: context.activeOrganizationId,
    }).findAll();
  }),

  /** GET /offers/active — currently active offers (date/time/day filtering) */
  active: organizationProcedure.offers.active.handler(({ context }) => {
    return offerRepository({
      db: context.db,
      organizationId: context.activeOrganizationId,
    }).findCurrentlyActive();
  }),

  one: organizationProcedure.offers.one.handler(async ({ context, input, errors }) => {
    const offer = await offerRepository({
      db: context.db,
      organizationId: context.activeOrganizationId,
    }).findById(input.id);

    if (!offer) {
      throw errors.NOT_FOUND({
        data: { offerId: input.id },
      });
    }
    return offer;
  }),

  create: organizationProcedure.offers.create.handler(
    async ({ context, input, errors }) => {
      const res = await offerRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).create(input);

      if (!res) {
        throw errors.BAD_REQUEST({
          message: 'Failed to create offer',
        });
      }
      return res;
    }
  ),

  update: organizationProcedure.offers.update.handler(
    async ({ context, input, errors }) => {
      const { id, ...data } = input;
      const updated = await offerRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).update(id, data);

      if (!updated) {
        throw errors.NOT_FOUND({
          data: { offerId: input.id },
        });
      }
      return updated;
    }
  ),

  delete: organizationProcedure.offers.delete.handler(
    async ({ context, input, errors }) => {
      const res = await offerRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).hardDelete(input.id);

      if (!res) {
        throw errors.NOT_FOUND({
          data: { offerId: input.id },
        });
      }
      return res;
    }
  ),

  // ─── Junction: Offer ↔ Categories ──────────────────────────────────

  /** GET /offers/{offerId}/categories */
  listCategories: organizationProcedure.offers.listCategories.handler(
    async ({ context, input, errors }) => {
      const repo = offerRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      });

      const offer = await repo.findById(input.offerId);
      if (!offer) {
        throw errors.NOT_FOUND({
          data: { offerId: input.offerId },
        });
      }

      return repo.findCategories(input.offerId);
    }
  ),

  /** POST /offers/{offerId}/categories */
  addCategory: organizationProcedure.offers.addCategory.handler(
    async ({ context, input, errors }) => {
      const repo = offerRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      });

      const offer = await repo.findById(input.offerId);
      if (!offer) {
        throw errors.NOT_FOUND({
          data: { offerId: input.offerId },
        });
      }

      const res = await repo.addCategory(input);
      if (!res) {
        throw errors.CONFLICT({
          message: 'Category already linked to this offer',
        });
      }
      return res;
    }
  ),

  /** DELETE /offers/{offerId}/categories/{categoryId} */
  removeCategory: organizationProcedure.offers.removeCategory.handler(
    async ({ context, input, errors }) => {
      const res = await offerRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).removeCategory(input.offerId, input.categoryId);

      if (!res) {
        throw errors.NOT_FOUND({
          message: 'Category not linked to this offer',
        });
      }
      return res;
    }
  ),

  // ─── Junction: Offer ↔ Products ────────────────────────────────────

  /** GET /offers/{offerId}/products */
  listProducts: organizationProcedure.offers.listProducts.handler(
    async ({ context, input, errors }) => {
      const repo = offerRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      });

      const offer = await repo.findById(input.offerId);
      if (!offer) {
        throw errors.NOT_FOUND({
          data: { offerId: input.offerId },
        });
      }

      return repo.findProducts(input.offerId);
    }
  ),

  /** POST /offers/{offerId}/products */
  addProduct: organizationProcedure.offers.addProduct.handler(
    async ({ context, input, errors }) => {
      const repo = offerRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      });

      const offer = await repo.findById(input.offerId);
      if (!offer) {
        throw errors.NOT_FOUND({
          data: { offerId: input.offerId },
        });
      }

      const res = await repo.addProduct(input);
      if (!res) {
        throw errors.CONFLICT({
          message: 'Product already linked to this offer',
        });
      }
      return res;
    }
  ),

  /** DELETE /offers/{offerId}/products/{productId} */
  removeProduct: organizationProcedure.offers.removeProduct.handler(
    async ({ context, input, errors }) => {
      const res = await offerRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).removeProduct(input.offerId, input.productId);

      if (!res) {
        throw errors.NOT_FOUND({
          message: 'Product not linked to this offer',
        });
      }
      return res;
    }
  ),
};

export default offerRouter;
