import { modifierOptionDependencyRepository } from '@repo/db/repositories';

import { organizationProcedure } from '../procedures';

const modifierDependencyRouter = {
  byModifier: organizationProcedure.modifierDependencies.byModifier.handler(
    ({ context, input }) => {
      return modifierOptionDependencyRepository({
        // ← Use the correct name
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).findByModifier(input.modifierId);
    }
  ),

  byTrigger: organizationProcedure.modifierDependencies.byTrigger.handler(
    ({ context, input }) => {
      return modifierOptionDependencyRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).findByTrigger(input.modifierId);
    }
  ),

  one: organizationProcedure.modifierDependencies.one.handler(
    async ({ context, input, errors }) => {
      const dep = await modifierOptionDependencyRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).findById(input.id);

      if (!dep) {
        throw errors.NOT_FOUND({
          data: { dependencyId: input.id },
        });
      }
      return dep;
    }
  ),

  create: organizationProcedure.modifierDependencies.create.handler(
    async ({ context, input, errors }) => {
      const res = await modifierOptionDependencyRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).create(input);

      if (!res) {
        throw errors.BAD_REQUEST({
          message: 'Failed to create dependency',
        });
      }
      return res;
    }
  ),

  update: organizationProcedure.modifierDependencies.update.handler(
    async ({ context, input, errors }) => {
      const { id, ...data } = input;
      const updated = await modifierOptionDependencyRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).update(id, data);

      if (!updated) {
        throw errors.NOT_FOUND({
          data: { dependencyId: input.id },
        });
      }
      return updated;
    }
  ),

  delete: organizationProcedure.modifierDependencies.delete.handler(
    async ({ context, input, errors }) => {
      const res = await modifierOptionDependencyRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).hardDelete(input.id);

      if (!res) {
        throw errors.NOT_FOUND({
          data: { dependencyId: input.id },
        });
      }
      return res;
    }
  ),
};

export default modifierDependencyRouter;
