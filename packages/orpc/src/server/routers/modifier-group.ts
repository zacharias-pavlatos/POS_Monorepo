import { modifierGroupRepository } from '@repo/db/repositories';

import { organizationProcedure } from '../procedures.js';

const modifierGroupRouter = {
  all: organizationProcedure.modifierGroups.all.handler(({ context }) => {
    return modifierGroupRepository({
      db: context.db,
      organizationId: context.activeOrganizationId,
    }).findAll();
  }),

  /** GET /modifier-groups/by-product/{productId} — main access pattern */
  byProduct: organizationProcedure.modifierGroups.byProduct.handler(
    ({ context, input }) => {
      return modifierGroupRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).findByProduct(input.productId);
    }
  ),

  one: organizationProcedure.modifierGroups.one.handler(
    async ({ context, input, errors }) => {
      const group = await modifierGroupRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).findById(input.id);

      if (!group) {
        throw errors.NOT_FOUND({
          data: { modifierGroupId: input.id },
        });
      }
      return group;
    }
  ),

  /** GET /modifier-groups/{id}/modifiers — group with modifiers + dependencies (POS checkout) */
  withModifiers: organizationProcedure.modifierGroups.withModifiers.handler(
    async ({ context, input, errors }) => {
      const group = await modifierGroupRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).findByIdWithModifiers(input.id);

      if (!group) {
        throw errors.NOT_FOUND({
          data: { modifierGroupId: input.id },
        });
      }
      return group;
    }
  ),

  create: organizationProcedure.modifierGroups.create.handler(
    async ({ context, input, errors }) => {
      const res = await modifierGroupRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).create(input);

      if (!res) {
        throw errors.BAD_REQUEST({
          message: 'Failed to create modifier group',
        });
      }
      return res;
    }
  ),

  update: organizationProcedure.modifierGroups.update.handler(
    async ({ context, input, errors }) => {
      const { id, ...data } = input;
      const updated = await modifierGroupRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).update(id, data);

      if (!updated) {
        throw errors.NOT_FOUND({
          data: { modifierGroupId: input.id },
        });
      }
      return updated;
    }
  ),

  delete: organizationProcedure.modifierGroups.delete.handler(
    async ({ context, input, errors }) => {
      const res = await modifierGroupRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).hardDelete(input.id);

      if (!res) {
        throw errors.NOT_FOUND({
          data: { modifierGroupId: input.id },
        });
      }
      return res;
    }
  ),
};

export default modifierGroupRouter;
