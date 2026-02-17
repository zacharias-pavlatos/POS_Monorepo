import { and, eq, isNull, sql, gte, lte, ne } from 'drizzle-orm';

import { check, checkItem, checkDiscount } from '../schemas/check';
import type {
  InsertCheckInputType,
  PatchCheckInputType,
  InsertCheckItemInputType,
  InsertCheckDiscountInputType,
} from '../schemas/check';
import type { TenantContext } from './types';

export const checkRepository = ({ db, organizationId }: TenantContext) => ({
  // ── Basic ─────────────────────────────────────────────────────────

  findById: (id: string) => {
    return db.query.check.findFirst({
      where: and(
        eq(check.id, id),
        eq(check.organizationId, organizationId),
        isNull(check.deletedAt)
      ),
    });
  },

  findByOrder: (orderId: string) => {
    return db.query.check.findMany({
      where: and(
        eq(check.organizationId, organizationId),
        eq(check.orderId, orderId),
        isNull(check.deletedAt)
      ),
    });
  },

  findAllOpen: () => {
    return db.query.check.findMany({
      where: and(
        eq(check.organizationId, organizationId),
        eq(check.status, 'open'),
        isNull(check.deletedAt)
      ),
    });
  },

  findByStatus: (status: 'open' | 'partially_paid' | 'paid' | 'voided') => {
    return db.query.check.findMany({
      where: and(
        eq(check.organizationId, organizationId),
        eq(check.status, status),
        isNull(check.deletedAt)
      ),
    });
  },

  // ── Aggregated ────────────────────────────────────────────────────

  /** Check with items, discounts, and payments (cashier view) */
  findByIdDetailed: (id: string) => {
    return db.query.check.findFirst({
      where: and(
        eq(check.id, id),
        eq(check.organizationId, organizationId),
        isNull(check.deletedAt)
      ),
      with: {
        items: {
          with: {
            orderItem: {
              with: { modifiers: true },
            },
          },
        },
        discounts: {
          with: {
            offer: true,
            appliedBy: true,
            approvedBy: true,
          },
        },
        payments: true,
        createdBy: true,
      },
    });
  },

  /** All checks for an order with full detail (billing overview) */
  findByOrderDetailed: (orderId: string) => {
    return db.query.check.findMany({
      where: and(
        eq(check.organizationId, organizationId),
        eq(check.orderId, orderId),
        isNull(check.deletedAt)
      ),
      with: {
        items: {
          with: {
            orderItem: {
              with: { modifiers: true },
            },
          },
        },
        discounts: true,
        payments: true,
      },
    });
  },

  /**
   * Everything needed for receipt printing:
   * check + items with modifiers + discounts + payments + order + session tables.
   */
  findByIdForReceipt: (id: string) => {
    return db.query.check.findFirst({
      where: and(
        eq(check.id, id),
        eq(check.organizationId, organizationId),
        isNull(check.deletedAt)
      ),
      with: {
        order: {
          with: {
            tableSession: {
              with: {
                tables: {
                  where: (st: any, { isNull: nil }: any) =>
                    and(nil(st.leftAt), nil(st.deletedAt)),
                  with: { table: true },
                },
              },
            },
            openedBy: true,
          },
        },
        items: {
          with: {
            orderItem: {
              with: { modifiers: true },
            },
          },
        },
        discounts: true,
        payments: {
          with: { processedBy: true },
        },
        createdBy: true,
      },
    });
  },

  /** Outstanding checks needing payment (dashboard) */
  findOutstanding: () => {
    return db.query.check.findMany({
      where: and(
        eq(check.organizationId, organizationId),
        ne(check.status, 'paid'),
        ne(check.status, 'voided'),
        isNull(check.deletedAt)
      ),
      with: {
        order: {
          with: {
            tableSession: {
              with: {
                tables: {
                  where: (st: any, { isNull: nil }: any) =>
                    and(nil(st.leftAt), nil(st.deletedAt)),
                  with: { table: true },
                },
              },
            },
          },
        },
        payments: true,
      },
    });
  },

  /** Revenue summary for a date range */
  revenueSummary: async (from: Date, to: Date) => {
    const result = await db
      .select({
        checkCount: sql<number>`count(*)`.as('check_count'),
        totalRevenue: sql<number>`coalesce(sum(${check.total}), 0)`.as('total_revenue'),
        totalDiscount: sql<number>`coalesce(sum(${check.discountTotal}), 0)`.as(
          'total_discount'
        ),
        totalTax: sql<number>`coalesce(sum(${check.taxTotal}), 0)`.as('total_tax'),
      })
      .from(check)
      .where(
        and(
          eq(check.organizationId, organizationId),
          eq(check.status, 'paid'),
          gte(check.paidAt, from),
          lte(check.paidAt, to),
          isNull(check.deletedAt)
        )
      );
    return result[0] ?? { checkCount: 0, totalRevenue: 0, totalDiscount: 0, totalTax: 0 };
  },

  // ── Mutations ─────────────────────────────────────────────────────

  create: async (payload: InsertCheckInputType) => {
    const [inserted] = await db
      .insert(check)
      .values({ ...payload, organizationId })
      .returning();
    return inserted;
  },

  update: async (id: string, payload: PatchCheckInputType) => {
    const [updated] = await db
      .update(check)
      .set(payload)
      .where(
        and(
          eq(check.id, id),
          eq(check.organizationId, organizationId),
          isNull(check.frozenAt),
          isNull(check.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  /** Update frozen totals (before freeze only) */
  updateTotals: async (
    id: string,
    totals: {
      subtotal: number;
      discountTotal: number;
      taxTotal: number;
      total: number;
    }
  ) => {
    const [updated] = await db
      .update(check)
      .set(totals)
      .where(
        and(
          eq(check.id, id),
          eq(check.organizationId, organizationId),
          isNull(check.frozenAt),
          isNull(check.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  /** Freeze the check (first completed payment) */
  freeze: async (id: string) => {
    const [updated] = await db
      .update(check)
      .set({ frozenAt: new Date() })
      .where(
        and(
          eq(check.id, id),
          eq(check.organizationId, organizationId),
          isNull(check.frozenAt),
          isNull(check.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  /** Update check status (open → partially_paid → paid) */
  updateStatus: async (id: string, status: 'partially_paid' | 'paid' | 'voided') => {
    const [updated] = await db
      .update(check)
      .set({
        status,
        ...(status === 'paid' ? { paidAt: new Date() } : {}),
      })
      .where(
        and(
          eq(check.id, id),
          eq(check.organizationId, organizationId),
          isNull(check.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  /** Void a check */
  void: async (id: string) => {
    const [updated] = await db
      .update(check)
      .set({ status: 'voided' })
      .where(
        and(
          eq(check.id, id),
          eq(check.organizationId, organizationId),
          isNull(check.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  softDelete: async (id: string) => {
    const [deleted] = await db
      .update(check)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(check.id, id),
          eq(check.organizationId, organizationId),
          isNull(check.deletedAt)
        )
      )
      .returning();
    return deleted ?? null;
  },
});

// ── Check Item ──────────────────────────────────────────────────────────

export const checkItemRepository = ({ db, organizationId }: TenantContext) => ({
  // ── Queries ─────────────────────────────────────────────────────────

  findByCheck: (checkId: string) => {
    return db.query.checkItem.findMany({
      where: and(
        eq(checkItem.organizationId, organizationId),
        eq(checkItem.checkId, checkId)
      ),
      with: {
        orderItem: {
          with: { modifiers: true },
        },
      },
    });
  },

  /** Find which check(s) an order item belongs to */
  findByOrderItem: (orderItemId: string) => {
    return db.query.checkItem.findMany({
      where: and(
        eq(checkItem.organizationId, organizationId),
        eq(checkItem.orderItemId, orderItemId)
      ),
    });
  },

  /**
   * Validate quantity allocation: sum of quantities across checks
   * for a given order item (must equal orderItem.quantity).
   */
  sumQuantityByOrderItem: async (orderItemId: string) => {
    const result = await db
      .select({
        totalAllocated: sql<number>`coalesce(sum(${checkItem.quantity}), 0)`.as(
          'total_allocated'
        ),
      })
      .from(checkItem)
      .where(
        and(
          eq(checkItem.organizationId, organizationId),
          eq(checkItem.orderItemId, orderItemId)
        )
      );
    return result[0]?.totalAllocated ?? 0;
  },

  // ── Mutations ─────────────────────────────────────────────────────

  create: async (payload: InsertCheckItemInputType) => {
    const [inserted] = await db
      .insert(checkItem)
      .values({ ...payload, organizationId })
      .onConflictDoNothing()
      .returning();
    return inserted ?? null;
  },

  createMany: async (payloads: InsertCheckItemInputType[]) => {
    return db
      .insert(checkItem)
      .values(payloads.map(p => ({ ...p, organizationId })))
      .onConflictDoNothing()
      .returning();
  },

  /** Update quantity for a check item (adjust split) */
  updateQuantity: async (checkId: string, orderItemId: string, quantity: number) => {
    const [updated] = await db
      .update(checkItem)
      .set({ quantity })
      .where(
        and(
          eq(checkItem.checkId, checkId),
          eq(checkItem.orderItemId, orderItemId),
          eq(checkItem.organizationId, organizationId)
        )
      )
      .returning();
    return updated ?? null;
  },

  /** Remove an item from a check */
  hardDelete: async (checkId: string, orderItemId: string) => {
    const [deleted] = await db
      .delete(checkItem)
      .where(
        and(
          eq(checkItem.checkId, checkId),
          eq(checkItem.orderItemId, orderItemId),
          eq(checkItem.organizationId, organizationId)
        )
      )
      .returning();
    return deleted ?? null;
  },

  /** Remove all items from a check (rebuilding a split) */
  hardDeleteByCheck: async (checkId: string) => {
    return db
      .delete(checkItem)
      .where(
        and(eq(checkItem.checkId, checkId), eq(checkItem.organizationId, organizationId))
      )
      .returning();
  },
});

// ── Check Discount ──────────────────────────────────────────────────────

export const checkDiscountRepository = ({ db, organizationId }: TenantContext) => ({
  // ── Queries ─────────────────────────────────────────────────────────

  findById: (id: string) => {
    return db.query.checkDiscount.findFirst({
      where: and(
        eq(checkDiscount.id, id),
        eq(checkDiscount.organizationId, organizationId)
      ),
    });
  },

  findByCheck: (checkId: string) => {
    return db.query.checkDiscount.findMany({
      where: and(
        eq(checkDiscount.organizationId, organizationId),
        eq(checkDiscount.checkId, checkId)
      ),
    });
  },

  findByIdDetailed: (id: string) => {
    return db.query.checkDiscount.findFirst({
      where: and(
        eq(checkDiscount.id, id),
        eq(checkDiscount.organizationId, organizationId)
      ),
      with: {
        offer: true,
        appliedBy: true,
        approvedBy: true,
      },
    });
  },

  /** All discounts for a check with accountability info */
  findByCheckDetailed: (checkId: string) => {
    return db.query.checkDiscount.findMany({
      where: and(
        eq(checkDiscount.organizationId, organizationId),
        eq(checkDiscount.checkId, checkId)
      ),
      with: {
        offer: true,
        appliedBy: true,
        approvedBy: true,
      },
    });
  },

  /** Count redemptions for an offer via check discounts */
  countByOffer: async (offerId: string) => {
    const result = await db
      .select({
        count: sql<number>`count(*)`.as('count'),
      })
      .from(checkDiscount)
      .where(
        and(
          eq(checkDiscount.organizationId, organizationId),
          eq(checkDiscount.offerId, offerId)
        )
      );
    return result[0]?.count ?? 0;
  },

  // ── Mutations ─────────────────────────────────────────────────────

  create: async (payload: InsertCheckDiscountInputType) => {
    const [inserted] = await db
      .insert(checkDiscount)
      .values({ ...payload, organizationId })
      .returning();
    return inserted;
  },

  /**
   * Remove a check discount (hard delete).
   * Only allowed before the check is frozen.
   * Caller must recalculate check totals after this.
   */
  hardDelete: async (id: string) => {
    const [deleted] = await db
      .delete(checkDiscount)
      .where(
        and(eq(checkDiscount.id, id), eq(checkDiscount.organizationId, organizationId))
      )
      .returning();
    return deleted ?? null;
  },

  /** Remove all discounts from a check */
  hardDeleteByCheck: async (checkId: string) => {
    return db
      .delete(checkDiscount)
      .where(
        and(
          eq(checkDiscount.checkId, checkId),
          eq(checkDiscount.organizationId, organizationId)
        )
      )
      .returning();
  },
});
