import { and, eq, isNull, sql } from 'drizzle-orm';

import { orderDiscount } from '../schemas/order-discount';
import type { InsertOrderDiscountInputType } from '../schemas/order-discount';
import type { TenantContext } from './types';

export const orderDiscountRepository = ({ db, organizationId }: TenantContext) => ({
  // ── Basic ───────────────────────────────────────────────────────────

  findById: (id: string) => {
    return db.query.orderDiscount.findFirst({
      where: and(
        eq(orderDiscount.id, id),
        eq(orderDiscount.organizationId, organizationId),
        isNull(orderDiscount.deletedAt)
      ),
    });
  },

  /** All active discounts for an order */
  findByOrder: (orderId: string) => {
    return db.query.orderDiscount.findMany({
      where: and(
        eq(orderDiscount.organizationId, organizationId),
        eq(orderDiscount.orderId, orderId),
        isNull(orderDiscount.deletedAt)
      ),
    });
  },

  /** Order-level discounts only (orderItemId is null) */
  findOrderLevel: (orderId: string) => {
    return db.query.orderDiscount.findMany({
      where: and(
        eq(orderDiscount.organizationId, organizationId),
        eq(orderDiscount.orderId, orderId),
        isNull(orderDiscount.orderItemId),
        isNull(orderDiscount.deletedAt)
      ),
    });
  },

  /** Item-level discounts for a specific item */
  findByItem: (orderItemId: string) => {
    return db.query.orderDiscount.findMany({
      where: and(
        eq(orderDiscount.organizationId, organizationId),
        eq(orderDiscount.orderItemId, orderItemId),
        isNull(orderDiscount.deletedAt)
      ),
    });
  },

  /** Discounts originating from a specific catalog offer */
  findByOffer: (offerId: string) => {
    return db.query.orderDiscount.findMany({
      where: and(
        eq(orderDiscount.organizationId, organizationId),
        eq(orderDiscount.offerId, offerId),
        isNull(orderDiscount.deletedAt)
      ),
    });
  },

  // ── Aggregated ──────────────────────────────────────────────────────

  /** Discount with full relations (for display) */
  findByIdDetailed: (id: string) => {
    return db.query.orderDiscount.findFirst({
      where: and(
        eq(orderDiscount.id, id),
        eq(orderDiscount.organizationId, organizationId),
        isNull(orderDiscount.deletedAt)
      ),
      with: {
        offer: true,
        appliedBy: true,
        approvedBy: true,
        orderItem: true,
      },
    });
  },

  /** All discounts for an order with accountability info */
  findByOrderDetailed: (orderId: string) => {
    return db.query.orderDiscount.findMany({
      where: and(
        eq(orderDiscount.organizationId, organizationId),
        eq(orderDiscount.orderId, orderId),
        isNull(orderDiscount.deletedAt)
      ),
      with: {
        offer: true,
        appliedBy: true,
        approvedBy: true,
        orderItem: true,
      },
    });
  },

  /** Count active redemptions for an offer (for maxRedemptions check) */
  countByOffer: async (offerId: string) => {
    const result = await db
      .select({
        count: sql<number>`count(*)`.as('count'),
      })
      .from(orderDiscount)
      .where(
        and(
          eq(orderDiscount.organizationId, organizationId),
          eq(orderDiscount.offerId, offerId),
          isNull(orderDiscount.deletedAt)
        )
      );
    return result[0]?.count ?? 0;
  },

  /** Discounts applied by a specific staff member (accountability report) */
  findByStaff: (appliedById: string) => {
    return db.query.orderDiscount.findMany({
      where: and(
        eq(orderDiscount.organizationId, organizationId),
        eq(orderDiscount.appliedById, appliedById),
        isNull(orderDiscount.deletedAt)
      ),
      with: {
        offer: true,
        order: true,
        orderItem: true,
      },
    });
  },

  // ── Mutations ───────────────────────────────────────────────────────

  create: async (payload: InsertOrderDiscountInputType) => {
    const [inserted] = await db
      .insert(orderDiscount)
      .values({ ...payload, organizationId })
      .returning();
    return inserted;
  },

  /**
   * Remove a discount (hard delete).
   * Audit log handles accountability for who removed it and why.
   * Caller must recalculate order totals after this.
   */
  hardDelete: async (id: string) => {
    const [deleted] = await db
      .delete(orderDiscount)
      .where(
        and(
          eq(orderDiscount.id, id),
          eq(orderDiscount.organizationId, organizationId)
        )
      )
      .returning();
    return deleted ?? null;
  },

  /** Remove all discounts for an order (used when voiding the order) */
  hardDeleteByOrder: async (orderId: string) => {
    return db
      .delete(orderDiscount)
      .where(
        and(
          eq(orderDiscount.organizationId, organizationId),
          eq(orderDiscount.orderId, orderId)
        )
      )
      .returning();
  },

  /** Remove all discounts for a specific item (used when voiding the item) */
  hardDeleteByItem: async (orderItemId: string) => {
    return db
      .delete(orderDiscount)
      .where(
        and(
          eq(orderDiscount.organizationId, organizationId),
          eq(orderDiscount.orderItemId, orderItemId)
        )
      )
      .returning();
  },
});
