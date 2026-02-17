import { and, eq, isNull } from 'drizzle-orm';

import { zone } from '../schemas/zone';
import type { InsertZoneInputType, PatchZoneInputType } from '../schemas/zone';
import type { TenantContext } from './types';

export const zoneRepository = ({ db, organizationId }: TenantContext) => ({
  // ── Basic ───────────────────────────────────────────────────────────

  findAll: () => {
    return db.query.zone.findMany({
      where: and(eq(zone.organizationId, organizationId), isNull(zone.deletedAt)),
      orderBy: zone.displayOrder,
    });
  },

  findById: (id: string) => {
    return db.query.zone.findFirst({
      where: and(
        eq(zone.id, id),
        eq(zone.organizationId, organizationId),
        isNull(zone.deletedAt)
      ),
    });
  },

  findByName: (name: string) => {
    return db.query.zone.findFirst({
      where: and(
        eq(zone.organizationId, organizationId),
        eq(zone.name, name),
        isNull(zone.deletedAt)
      ),
    });
  },

  findAllActive: () => {
    return db.query.zone.findMany({
      where: and(
        eq(zone.organizationId, organizationId),
        eq(zone.isActive, true),
        isNull(zone.deletedAt)
      ),
      orderBy: zone.displayOrder,
    });
  },

  // ── Aggregated ──────────────────────────────────────────────────────

  /** Zone with all its tables */
  findByIdWithTables: (id: string) => {
    return db.query.zone.findFirst({
      where: and(
        eq(zone.id, id),
        eq(zone.organizationId, organizationId),
        isNull(zone.deletedAt)
      ),
      with: {
        tables: {
          orderBy: (t: any, { asc }: any) => [asc(t.displayOrder)],
        },
      },
    });
  },

  /** All active zones with their tables (floor plan layout) */
  findAllWithTables: () => {
    return db.query.zone.findMany({
      where: and(
        eq(zone.organizationId, organizationId),
        eq(zone.isActive, true),
        isNull(zone.deletedAt)
      ),
      orderBy: zone.displayOrder,
      with: {
        tables: {
          orderBy: (t: any, { asc }: any) => [asc(t.displayOrder)],
        },
      },
    });
  },

  /**
   * Floor plan with occupancy status.
   * Zones → tables → active session membership → session → open orders.
   */
  findAllWithOccupancy: () => {
    return db.query.zone.findMany({
      where: and(
        eq(zone.organizationId, organizationId),
        eq(zone.isActive, true),
        isNull(zone.deletedAt)
      ),
      orderBy: zone.displayOrder,
      with: {
        tables: {
          orderBy: (t: any, { asc }: any) => [asc(t.displayOrder)],
          with: {
            sessionTables: {
              where: (st: any, { isNull: nil }: any) =>
                and(nil(st.leftAt), nil(st.deletedAt)),
              limit: 1,
              with: {
                tableSession: {
                  with: {
                    orders: {
                      where: (o: any, { eq: e }: any) => e(o.status, 'open'),
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  },

  // ── Mutations ───────────────────────────────────────────────────────

  create: async (payload: InsertZoneInputType) => {
    const [inserted] = await db
      .insert(zone)
      .values({ ...payload, organizationId })
      .returning();
    return inserted;
  },

  update: async (id: string, payload: PatchZoneInputType) => {
    const [updated] = await db
      .update(zone)
      .set(payload)
      .where(
        and(
          eq(zone.id, id),
          eq(zone.organizationId, organizationId),
          isNull(zone.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  softDelete: async (id: string) => {
    const [deleted] = await db
      .update(zone)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(zone.id, id),
          eq(zone.organizationId, organizationId),
          isNull(zone.deletedAt)
        )
      )
      .returning();
    return deleted ?? null;
  },

  hardDelete: async (id: string) => {
    const [deleted] = await db
      .delete(zone)
      .where(and(eq(zone.id, id), eq(zone.organizationId, organizationId)))
      .returning();
    return deleted ?? null;
  },
});
