import { and, eq, isNull } from 'drizzle-orm';

import { workstation } from '../schemas/workstation';
import type {
  InsertWorkStationInputType,
  PatchWorkStationInputType,
} from '../schemas/workstation';
import type { TenantContext } from './types';

export const workstationRepository = ({ db, organizationId }: TenantContext) => ({
  findAll: () => {
    return db.query.workstation.findMany({
      where: and(
        eq(workstation.organizationId, organizationId),
        isNull(workstation.deletedAt)
      ),
    });
  },

  findById: (id: string) => {
    return db.query.workstation.findFirst({
      where: and(
        eq(workstation.id, id),
        eq(workstation.organizationId, organizationId),
        isNull(workstation.deletedAt)
      ),
    });
  },

  findByName: (name: string) => {
    return db.query.workstation.findFirst({
      where: and(
        eq(workstation.organizationId, organizationId),
        eq(workstation.name, name),
        isNull(workstation.deletedAt)
      ),
    });
  },

  findAllActive: () => {
    return db.query.workstation.findMany({
      where: and(
        eq(workstation.organizationId, organizationId),
        eq(workstation.isActive, true),
        isNull(workstation.deletedAt)
      ),
      orderBy: workstation.displayOrder,
    });
  },

  /** Workstation with assigned categories */
  findByIdWithCategories: (id: string) => {
    return db.query.workstation.findFirst({
      where: and(
        eq(workstation.id, id),
        eq(workstation.organizationId, organizationId),
        isNull(workstation.deletedAt)
      ),
      with: {
        categories: true,
      },
    });
  },

  /** Workstation with categories and products assigned to it */
  findByIdDetailed: (id: string) => {
    return db.query.workstation.findFirst({
      where: and(
        eq(workstation.id, id),
        eq(workstation.organizationId, organizationId),
        isNull(workstation.deletedAt)
      ),
      with: {
        categories: true,
        products: true,
      },
    });
  },

  create: async (payload: InsertWorkStationInputType) => {
    const [inserted] = await db
      .insert(workstation)
      .values({ ...payload, organizationId })
      .returning();
    return inserted;
  },

  update: async (id: string, payload: PatchWorkStationInputType) => {
    const [updated] = await db
      .update(workstation)
      .set(payload)
      .where(
        and(
          eq(workstation.id, id),
          eq(workstation.organizationId, organizationId),
          isNull(workstation.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  softDelete: async (id: string) => {
    const [deleted] = await db
      .update(workstation)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(workstation.id, id),
          eq(workstation.organizationId, organizationId),
          isNull(workstation.deletedAt)
        )
      )
      .returning();
    return deleted ?? null;
  },

  hardDelete: async (id: string) => {
    const [deleted] = await db
      .delete(workstation)
      .where(and(eq(workstation.id, id), eq(workstation.organizationId, organizationId)))
      .returning();
    return deleted ?? null;
  },
});
