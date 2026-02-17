import { and, eq, isNull, sql, between, gte, lte } from 'drizzle-orm';

import { tableSession, tableSessionTable } from '../schemas/table-session';
import type {
  InsertTableSessionInputType,
  PatchTableSessionInputType,
  InsertTableSessionTableInputType,
} from '../schemas/table-session';
import type { TenantContext } from './types';

export const tableSessionRepository = ({ db, organizationId }: TenantContext) => ({
  // ── Basic ───────────────────────────────────────────────────────────

  findAll: () => {
    return db.query.tableSession.findMany({
      where: and(
        eq(tableSession.organizationId, organizationId),
        isNull(tableSession.deletedAt)
      ),
    });
  },

  findById: (id: string) => {
    return db.query.tableSession.findFirst({
      where: and(
        eq(tableSession.id, id),
        eq(tableSession.organizationId, organizationId),
        isNull(tableSession.deletedAt)
      ),
    });
  },

  findAllActive: () => {
    return db.query.tableSession.findMany({
      where: and(
        eq(tableSession.organizationId, organizationId),
        eq(tableSession.status, 'active'),
        isNull(tableSession.deletedAt)
      ),
    });
  },

  findByType: (type: 'dine_in' | 'tab' | 'takeaway' | 'delivery') => {
    return db.query.tableSession.findMany({
      where: and(
        eq(tableSession.organizationId, organizationId),
        eq(tableSession.type, type),
        eq(tableSession.status, 'active'),
        isNull(tableSession.deletedAt)
      ),
    });
  },

  // ── Aggregated ──────────────────────────────────────────────────────

  /** Active sessions with their current tables (floor plan) */
  findAllActiveWithTables: () => {
    return db.query.tableSession.findMany({
      where: and(
        eq(tableSession.organizationId, organizationId),
        eq(tableSession.status, 'active'),
        isNull(tableSession.deletedAt)
      ),
      with: {
        tables: {
          where: (st: any, { isNull: nil }: any) =>
            and(nil(st.leftAt), nil(st.deletedAt)),
          with: { table: true },
        },
      },
    });
  },

  /** Session with current tables only */
  findByIdWithTables: (id: string) => {
    return db.query.tableSession.findFirst({
      where: and(
        eq(tableSession.id, id),
        eq(tableSession.organizationId, organizationId),
        isNull(tableSession.deletedAt)
      ),
      with: {
        tables: {
          where: (st: any, { isNull: nil }: any) =>
            and(nil(st.leftAt), nil(st.deletedAt)),
          with: { table: true },
        },
      },
    });
  },

  /** Session with full table history (includes moved/split tables) */
  findByIdWithTableHistory: (id: string) => {
    return db.query.tableSession.findFirst({
      where: and(
        eq(tableSession.id, id),
        eq(tableSession.organizationId, organizationId),
        isNull(tableSession.deletedAt)
      ),
      with: {
        tables: {
          with: { table: true },
          orderBy: (st: any, { asc }: any) => [asc(st.joinedAt)],
        },
      },
    });
  },

  /** Session with orders and items (waiter view) */
  findByIdWithOrders: (id: string) => {
    return db.query.tableSession.findFirst({
      where: and(
        eq(tableSession.id, id),
        eq(tableSession.organizationId, organizationId),
        isNull(tableSession.deletedAt)
      ),
      with: {
        tables: {
          where: (st: any, { isNull: nil }: any) =>
            and(nil(st.leftAt), nil(st.deletedAt)),
          with: { table: true },
        },
        orders: {
          with: {
            items: {
              with: { modifiers: true },
            },
            discounts: true,
          },
        },
      },
    });
  },

  /**
   * Full session detail: tables + orders + items + modifiers + discounts
   * + checks + payments.
   * Used for session closeout / manager review.
   */
  findByIdDetailed: (id: string) => {
    return db.query.tableSession.findFirst({
      where: and(
        eq(tableSession.id, id),
        eq(tableSession.organizationId, organizationId),
        isNull(tableSession.deletedAt)
      ),
      with: {
        tables: {
          with: { table: true },
        },
        orders: {
          with: {
            items: {
              with: { modifiers: true },
            },
            discounts: true,
            checks: {
              with: {
                items: true,
                discounts: true,
                payments: true,
              },
            },
          },
        },
      },
    });
  },

  /** Sessions opened within a date range (reporting) */
  findByDateRange: (from: Date, to: Date) => {
    return db.query.tableSession.findMany({
      where: and(
        eq(tableSession.organizationId, organizationId),
        gte(tableSession.openedAt, from),
        lte(tableSession.openedAt, to),
        isNull(tableSession.deletedAt)
      ),
      orderBy: tableSession.openedAt,
    });
  },

  /** Count active sessions by type (dashboard stats) */
  countActiveByType: async () => {
    return db
      .select({
        type: tableSession.type,
        count: sql<number>`count(*)`.as('count'),
        totalGuests: sql<number>`coalesce(sum(${tableSession.guestCount}), 0)`.as(
          'total_guests'
        ),
      })
      .from(tableSession)
      .where(
        and(
          eq(tableSession.organizationId, organizationId),
          eq(tableSession.status, 'active'),
          isNull(tableSession.deletedAt)
        )
      )
      .groupBy(tableSession.type);
  },

  // ── Mutations ───────────────────────────────────────────────────────

  create: async (payload: InsertTableSessionInputType) => {
    const [inserted] = await db
      .insert(tableSession)
      .values({ ...payload, organizationId })
      .returning();
    return inserted;
  },

  update: async (id: string, payload: PatchTableSessionInputType) => {
    const [updated] = await db
      .update(tableSession)
      .set(payload)
      .where(
        and(
          eq(tableSession.id, id),
          eq(tableSession.organizationId, organizationId),
          isNull(tableSession.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  /** Close a session (after all checks are paid) */
  close: async (id: string, closedByUserId: string) => {
    const [updated] = await db
      .update(tableSession)
      .set({
        status: 'closed',
        closedAt: new Date(),
        closedByUserId,
      })
      .where(
        and(
          eq(tableSession.id, id),
          eq(tableSession.organizationId, organizationId),
          eq(tableSession.status, 'active'),
          isNull(tableSession.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  /** Void a session (mistake/walkout) */
  void: async (id: string, closedByUserId: string) => {
    const [updated] = await db
      .update(tableSession)
      .set({
        status: 'voided',
        closedAt: new Date(),
        closedByUserId,
      })
      .where(
        and(
          eq(tableSession.id, id),
          eq(tableSession.organizationId, organizationId),
          eq(tableSession.status, 'active'),
          isNull(tableSession.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  softDelete: async (id: string) => {
    const [deleted] = await db
      .update(tableSession)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(tableSession.id, id),
          eq(tableSession.organizationId, organizationId),
          isNull(tableSession.deletedAt)
        )
      )
      .returning();
    return deleted ?? null;
  },
});

// ── Table Session <-> Table membership ──────────────────────────────────

export const tableSessionTableRepository = ({
  db,
  organizationId,
}: TenantContext) => ({
  // ── Queries ─────────────────────────────────────────────────────────

  /** Current tables in a session (leftAt is null) */
  findCurrentBySession: (tableSessionId: string) => {
    return db.query.tableSessionTable.findMany({
      where: and(
        eq(tableSessionTable.organizationId, organizationId),
        eq(tableSessionTable.tableSessionId, tableSessionId),
        isNull(tableSessionTable.leftAt),
        isNull(tableSessionTable.deletedAt)
      ),
      with: { table: true },
    });
  },

  /** Full history for a session (includes tables that left) */
  findAllBySession: (tableSessionId: string) => {
    return db.query.tableSessionTable.findMany({
      where: and(
        eq(tableSessionTable.organizationId, organizationId),
        eq(tableSessionTable.tableSessionId, tableSessionId),
        isNull(tableSessionTable.deletedAt)
      ),
      with: { table: true },
      orderBy: tableSessionTable.joinedAt,
    });
  },

  /** Find active session for a physical table (is it occupied?) */
  findActiveByTable: (tableId: string) => {
    return db.query.tableSessionTable.findFirst({
      where: and(
        eq(tableSessionTable.organizationId, organizationId),
        eq(tableSessionTable.tableId, tableId),
        isNull(tableSessionTable.leftAt),
        isNull(tableSessionTable.deletedAt)
      ),
      with: { tableSession: true },
    });
  },

  /** Is a table currently occupied? (boolean check, cheaper than full query) */
  isTableOccupied: async (tableId: string) => {
    const row = await db.query.tableSessionTable.findFirst({
      where: and(
        eq(tableSessionTable.organizationId, organizationId),
        eq(tableSessionTable.tableId, tableId),
        isNull(tableSessionTable.leftAt),
        isNull(tableSessionTable.deletedAt)
      ),
      columns: { id: true },
    });
    return !!row;
  },

  // ── Mutations ───────────────────────────────────────────────────────

  /** Join: attach a table to a session (seat / merge) */
  join: async (
    payload: InsertTableSessionTableInputType & { joinedByUserId?: string }
  ) => {
    const [inserted] = await db
      .insert(tableSessionTable)
      .values({ ...payload, organizationId })
      .returning();
    return inserted;
  },

  /** Leave: detach a table from a session (split / move away) */
  leave: async (id: string, leftByUserId?: string) => {
    const [updated] = await db
      .update(tableSessionTable)
      .set({
        leftAt: new Date(),
        ...(leftByUserId ? { leftByUserId } : {}),
      })
      .where(
        and(
          eq(tableSessionTable.id, id),
          eq(tableSessionTable.organizationId, organizationId),
          isNull(tableSessionTable.leftAt),
          isNull(tableSessionTable.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  /** Leave all: detach all tables from a session (closing out) */
  leaveAll: async (tableSessionId: string, leftByUserId?: string) => {
    return db
      .update(tableSessionTable)
      .set({
        leftAt: new Date(),
        ...(leftByUserId ? { leftByUserId } : {}),
      })
      .where(
        and(
          eq(tableSessionTable.organizationId, organizationId),
          eq(tableSessionTable.tableSessionId, tableSessionId),
          isNull(tableSessionTable.leftAt),
          isNull(tableSessionTable.deletedAt)
        )
      )
      .returning();
  },
});
