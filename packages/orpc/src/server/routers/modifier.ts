import { modifierRepository } from '@repo/db/repositories';

import { organizationProcedure } from '../procedures.js';

const modifierRouter = {
  /** GET /modifiers/by-group/{modifierGroupId} — list modifiers in a group */
  byGroup: organizationProcedure.modifiers.byGroup.handler(({ context, input }) => {
    return modifierRepository({
      db: context.db,
      organizationId: context.activeOrganizationId,
    }).findByGroup(input.modifierGroupId);
  }),

  one: organizationProcedure.modifiers.one.handler(async ({ context, input, errors }) => {
    const mod = await modifierRepository({
      db: context.db,
      organizationId: context.activeOrganizationId,
    }).findById(input.id);

    if (!mod) {
      throw errors.NOT_FOUND({
        data: { modifierId: input.id },
      });
    }
    return mod;
  }),

  /** GET /modifiers/{id}/dependencies — modifier with dependencies + dependents */
  withDependencies: organizationProcedure.modifiers.withDependencies.handler(
    async ({ context, input, errors }) => {
      const mod = await modifierRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).findByIdWithDependencies(input.id);

      if (!mod) {
        throw errors.NOT_FOUND({
          data: { modifierId: input.id },
        });
      }
      return mod;
    }
  ),

  create: organizationProcedure.modifiers.create.handler(
    async ({ context, input, errors }) => {
      const res = await modifierRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).create(input);

      if (!res) {
        throw errors.BAD_REQUEST({
          message: 'Failed to create modifier',
        });
      }
      return res;
    }
  ),

  update: organizationProcedure.modifiers.update.handler(
    async ({ context, input, errors }) => {
      const { id, ...data } = input;
      const updated = await modifierRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).update(id, data);

      if (!updated) {
        throw errors.NOT_FOUND({
          data: { modifierId: input.id },
        });
      }
      return updated;
    }
  ),

  delete: organizationProcedure.modifiers.delete.handler(
    async ({ context, input, errors }) => {
      const res = await modifierRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).hardDelete(input.id);

      if (!res) {
        throw errors.NOT_FOUND({
          data: { modifierId: input.id },
        });
      }
      return res;
    }
  ),
};

export default modifierRouter;
