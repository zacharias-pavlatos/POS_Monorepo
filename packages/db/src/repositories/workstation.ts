import { and, eq, isNull } from 'drizzle-orm';

import { workStation } from '../schemas/workstation';
import type {
  InsertWorkStationInputType,
  PatchWorkStationInputType,
} from '../schemas/workstation';
import type { TenantContext } from './types';

export const workstationRepository = ({ db, organizationId }: TenantContext) => ({
  findAll: () => {
    return db.query.workStation.findMany({
      where: and(
        eq(workStation.organizationId, organizationId),
        isNull(workStation.deletedAt)
      ),
    });
  },

  findById: (id: string) => {
    return db.query.workStation.findFirst({
      where: and(
        eq(workStation.id, id),
        eq(workStation.organizationId, organizationId),
        isNull(workStation.deletedAt)
      ),
    });
  },

  findByName: (name: string) => {
    return db.query.workStation.findFirst({
      where: and(
        eq(workStation.organizationId, organizationId),
        eq(workStation.name, name),
        isNull(workStation.deletedAt)
      ),
    });
  },

  findAllActive: () => {
    return db.query.workStation.findMany({
      where: and(
        eq(workStation.organizationId, organizationId),
        eq(workStation.isActive, true),
        isNull(workStation.deletedAt)
      ),
      orderBy: workStation.displayOrder,
    });
  },

  /** Workstation with assigned categories */
  findByIdWithCategories: (id: string) => {
    return db.query.workStation.findFirst({
      where: and(
        eq(workStation.id, id),
        eq(workStation.organizationId, organizationId),
        isNull(workStation.deletedAt)
      ),
      with: {
        categories: true,
      },
    });
  },

  /** Workstation with categories and products assigned to it */
  findByIdDetailed: (id: string) => {
    return db.query.workStation.findFirst({
      where: and(
        eq(workStation.id, id),
        eq(workStation.organizationId, organizationId),
        isNull(workStation.deletedAt)
      ),
      with: {
        categories: true,
        products: true,
      },
    });
  },

  create: async (payload: InsertWorkStationInputType) => {
    const [inserted] = await db
      .insert(workStation)
      .values({ ...payload, organizationId })
      .returning();
    return inserted;
  },

  update: async (id: string, payload: PatchWorkStationInputType) => {
    const [updated] = await db
      .update(workStation)
      .set(payload)
      .where(
        and(
          eq(workStation.id, id),
          eq(workStation.organizationId, organizationId),
          isNull(workStation.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  softDelete: async (id: string) => {
    const [deleted] = await db
      .update(workStation)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(workStation.id, id),
          eq(workStation.organizationId, organizationId),
          isNull(workStation.deletedAt)
        )
      )
      .returning();
    return deleted ?? null;
  },

  hardDelete: async (id: string) => {
    const [deleted] = await db
      .delete(workStation)
      .where(and(eq(workStation.id, id), eq(workStation.organizationId, organizationId)))
      .returning();
    return deleted ?? null;
  },
});
