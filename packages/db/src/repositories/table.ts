import { and, eq, isNull } from 'drizzle-orm';

import { diningTable } from '../schemas/table';
import type {
  InsertDiningTableInputType,
  PatchDiningTableInputType,
} from '../schemas/table';
import type { TenantContext } from './types';

export const diningTableRepository = ({ db, organizationId }: TenantContext) => ({
  // ── Basic ───────────────────────────────────────────────────────────

  findAll: () => {
    return db.query.diningTable.findMany({
      where: and(
        eq(diningTable.organizationId, organizationId),
        isNull(diningTable.deletedAt)
      ),
      orderBy: diningTable.displayOrder,
    });
  },

  findById: (id: string) => {
    return db.query.diningTable.findFirst({
      where: and(
        eq(diningTable.id, id),
        eq(diningTable.organizationId, organizationId),
        isNull(diningTable.deletedAt)
      ),
    });
  },

  findByLabel: (label: string) => {
    return db.query.diningTable.findFirst({
      where: and(
        eq(diningTable.organizationId, organizationId),
        eq(diningTable.label, label),
        isNull(diningTable.deletedAt)
      ),
    });
  },

  findByZone: (zoneId: string) => {
    return db.query.diningTable.findMany({
      where: and(
        eq(diningTable.organizationId, organizationId),
        eq(diningTable.zoneId, zoneId),
        isNull(diningTable.deletedAt)
      ),
      orderBy: diningTable.displayOrder,
    });
  },

  findAllActive: () => {
    return db.query.diningTable.findMany({
      where: and(
        eq(diningTable.organizationId, organizationId),
        eq(diningTable.isActive, true),
        isNull(diningTable.deletedAt)
      ),
      orderBy: diningTable.displayOrder,
    });
  },

  // ── Aggregated ──────────────────────────────────────────────────────

  /** Table with its zone info */
  findByIdWithZone: (id: string) => {
    return db.query.diningTable.findFirst({
      where: and(
        eq(diningTable.id, id),
        eq(diningTable.organizationId, organizationId),
        isNull(diningTable.deletedAt)
      ),
      with: { zone: true },
    });
  },

  /**
   * Table with its current session and open orders.
   * Used when a waiter taps on a table to see what's happening.
   *
   * Requires `sessionTables: many(tableSessionTable)` on diningTable relations.
   */
  findByIdWithCurrentSession: (id: string) => {
    return db.query.diningTable.findFirst({
      where: and(
        eq(diningTable.id, id),
        eq(diningTable.organizationId, organizationId),
        isNull(diningTable.deletedAt)
      ),
      with: {
        zone: true,
        sessionTables: {
          where: (st: any, { isNull: nil }: any) =>
            and(nil(st.leftAt), nil(st.deletedAt)),
          limit: 1,
          with: {
            tableSession: {
              with: {
                orders: {
                  where: (o: any, { eq: e }: any) => e(o.status, 'open'),
                  with: {
                    items: {
                      with: { modifiers: true },
                    },
                    discounts: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  },

  /**
   * All tables with occupancy status.
   * Quickly determine which tables are free vs occupied.
   *
   * Requires `sessionTables: many(tableSessionTable)` on diningTable relations.
   */
  findAllWithOccupancy: () => {
    return db.query.diningTable.findMany({
      where: and(
        eq(diningTable.organizationId, organizationId),
        eq(diningTable.isActive, true),
        isNull(diningTable.deletedAt)
      ),
      orderBy: diningTable.displayOrder,
      with: {
        zone: true,
        sessionTables: {
          where: (st: any, { isNull: nil }: any) =>
            and(nil(st.leftAt), nil(st.deletedAt)),
          limit: 1,
          with: { tableSession: true },
        },
      },
    });
  },

  // ── Mutations ───────────────────────────────────────────────────────

  create: async (payload: InsertDiningTableInputType) => {
    const [inserted] = await db
      .insert(diningTable)
      .values({ ...payload, organizationId })
      .returning();
    return inserted;
  },

  update: async (id: string, payload: PatchDiningTableInputType) => {
    const [updated] = await db
      .update(diningTable)
      .set(payload)
      .where(
        and(
          eq(diningTable.id, id),
          eq(diningTable.organizationId, organizationId),
          isNull(diningTable.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  softDelete: async (id: string) => {
    const [deleted] = await db
      .update(diningTable)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(diningTable.id, id),
          eq(diningTable.organizationId, organizationId),
          isNull(diningTable.deletedAt)
        )
      )
      .returning();
    return deleted ?? null;
  },

  hardDelete: async (id: string) => {
    const [deleted] = await db
      .delete(diningTable)
      .where(
        and(eq(diningTable.id, id), eq(diningTable.organizationId, organizationId))
      )
      .returning();
    return deleted ?? null;
  },
});
