import { ORPCError } from '@orpc/server';
import { workstationRepository } from '@repo/db/repositories';

import { organizationProcedure } from '../procedures';

const workstationRouter = {
  all: organizationProcedure.workstations.all.handler(({ context }) => {
    return workstationRepository({
      db: context.db,
      organizationId: context.activeOrganizationId,
    }).findAll();
  }),

  one: organizationProcedure.workstations.one.handler(
    async ({ context, input, errors }) => {
      const workstation = await workstationRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).findById(input.id);

      if (!workstation) {
        throw errors.NOT_FOUND({
          data: { workstationId: input.id },
        });
      }
      return workstation;
    }
  ),

  /** GET /workstations/{id}/categories — workstation with assigned categories */
  oneWithCategories: organizationProcedure.workstations.oneWithCategories.handler(
    async ({ context, input, errors }) => {
      const workstation = await workstationRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).findByIdWithCategories(input.id);

      if (!workstation) {
        throw errors.NOT_FOUND({
          data: { workstationId: input.id },
        });
      }
      return workstation;
    }
  ),

  /** GET /workstations/{id}/detailed — workstation with categories + products */
  oneDetailed: organizationProcedure.workstations.oneDetailed.handler(
    async ({ context, input, errors }) => {
      const workstation = await workstationRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).findByIdDetailed(input.id);

      if (!workstation) {
        throw errors.NOT_FOUND({
          data: { workstationId: input.id },
        });
      }
      return workstation;
    }
  ),

  create: organizationProcedure.workstations.create.handler(
    async ({ context, input, errors }) => {
      const res = await workstationRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).create(input);

      if (!res) {
        throw errors.BAD_REQUEST({
          message: 'Failed to create workstation',
        });
      }
      return res;
    }
  ),

  update: organizationProcedure.workstations.update.handler(
    async ({ context, input, errors }) => {
      const { id, ...data } = input;
      const updated = await workstationRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      }).update(id, data);

      if (!updated) {
        throw errors.NOT_FOUND({
          data: { workstationId: input.id },
        });
      }
      return updated;
    }
  ),

  delete: organizationProcedure.workstations.delete.handler(
    async ({ context, input, errors }) => {
      const repo = workstationRepository({
        db: context.db,
        organizationId: context.activeOrganizationId,
      });

      const withCategories = await repo.findByIdWithCategories(input.id);

      if (!withCategories) {
        throw errors.NOT_FOUND({ data: { workstationId: input.id } });
      }

      if (withCategories.categories.length > 0) {
        const count = withCategories.categories.length;
        throw new ORPCError('CONFLICT', {
          message: `Cannot delete: ${count} ${count === 1 ? 'category is' : 'categories are'} still assigned to this workstation. Reassign them first.`,
        });
      }

      const res = await repo.hardDelete(input.id);

      if (!res) {
        throw errors.NOT_FOUND({ data: { workstationId: input.id } });
      }
      return res;
    }
  ),
};

export default workstationRouter;
