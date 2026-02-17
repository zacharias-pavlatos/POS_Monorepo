import { and, eq, isNull, sql, gte, lte } from 'drizzle-orm';

import { payment } from '../schemas/payment';
import type { InsertPaymentInputType } from '../schemas/payment';
import type { TenantContext } from './types';

export const paymentRepository = ({ db, organizationId }: TenantContext) => ({
  // ── Basic ───────────────────────────────────────────────────────────

  findById: (id: string) => {
    return db.query.payment.findFirst({
      where: and(
        eq(payment.id, id),
        eq(payment.organizationId, organizationId),
        isNull(payment.deletedAt)
      ),
    });
  },

  findByCheck: (checkId: string) => {
    return db.query.payment.findMany({
      where: and(
        eq(payment.organizationId, organizationId),
        eq(payment.checkId, checkId),
        isNull(payment.deletedAt)
      ),
    });
  },

  findByStatus: (status: 'completed' | 'failed' | 'refunded') => {
    return db.query.payment.findMany({
      where: and(
        eq(payment.organizationId, organizationId),
        eq(payment.status, status),
        isNull(payment.deletedAt)
      ),
    });
  },

  findByExternalReference: (ref: string) => {
    return db.query.payment.findFirst({
      where: and(
        eq(payment.organizationId, organizationId),
        eq(payment.externalReference, ref),
        isNull(payment.deletedAt)
      ),
    });
  },

  // ── Aggregated ──────────────────────────────────────────────────────

  /** Payment with check and processor info */
  findByIdDetailed: (id: string) => {
    return db.query.payment.findFirst({
      where: and(
        eq(payment.id, id),
        eq(payment.organizationId, organizationId),
        isNull(payment.deletedAt)
      ),
      with: {
        check: {
          with: { order: true },
        },
        processedBy: true,
      },
    });
  },

  /** All payments for a check with processor info */
  findByCheckDetailed: (checkId: string) => {
    return db.query.payment.findMany({
      where: and(
        eq(payment.organizationId, organizationId),
        eq(payment.checkId, checkId),
        isNull(payment.deletedAt)
      ),
      with: { processedBy: true },
    });
  },

  /** Sum of completed payments for a check (for computing remaining balance) */
  sumByCheck: async (checkId: string) => {
    const result = await db
      .select({
        totalPaid: sql<number>`coalesce(sum(${payment.amount}), 0)`.as('total_paid'),
        totalTips: sql<number>`coalesce(sum(${payment.tipAmount}), 0)`.as(
          'total_tips'
        ),
      })
      .from(payment)
      .where(
        and(
          eq(payment.organizationId, organizationId),
          eq(payment.checkId, checkId),
          eq(payment.status, 'completed'),
          isNull(payment.deletedAt)
        )
      );
    return result[0] ?? { totalPaid: 0, totalTips: 0 };
  },

  // ── Reporting ─────────────────────────────────────────────────────

  /** Revenue by payment method (cash vs card breakdown) */
  revenueByMethod: async (from: Date, to: Date) => {
    return db
      .select({
        method: payment.method,
        count: sql<number>`count(*)`.as('count'),
        totalAmount: sql<number>`coalesce(sum(${payment.amount}), 0)`.as(
          'total_amount'
        ),
        totalTips: sql<number>`coalesce(sum(${payment.tipAmount}), 0)`.as(
          'total_tips'
        ),
      })
      .from(payment)
      .where(
        and(
          eq(payment.organizationId, organizationId),
          eq(payment.status, 'completed'),
          gte(payment.processedAt, from),
          lte(payment.processedAt, to),
          isNull(payment.deletedAt)
        )
      )
      .groupBy(payment.method);
  },

  /** Daily revenue totals */
  dailyRevenue: async (from: Date, to: Date) => {
    return db
      .select({
        date: sql<string>`date(${payment.processedAt})`.as('date'),
        count: sql<number>`count(*)`.as('count'),
        totalAmount: sql<number>`coalesce(sum(${payment.amount}), 0)`.as(
          'total_amount'
        ),
        totalTips: sql<number>`coalesce(sum(${payment.tipAmount}), 0)`.as(
          'total_tips'
        ),
      })
      .from(payment)
      .where(
        and(
          eq(payment.organizationId, organizationId),
          eq(payment.status, 'completed'),
          gte(payment.processedAt, from),
          lte(payment.processedAt, to),
          isNull(payment.deletedAt)
        )
      )
      .groupBy(sql`date(${payment.processedAt})`)
      .orderBy(sql`date(${payment.processedAt})`);
  },

  /** Revenue by staff member (who processed the most payments) */
  revenueByStaff: async (from: Date, to: Date) => {
    return db
      .select({
        processedById: payment.processedById,
        count: sql<number>`count(*)`.as('count'),
        totalAmount: sql<number>`coalesce(sum(${payment.amount}), 0)`.as(
          'total_amount'
        ),
        totalTips: sql<number>`coalesce(sum(${payment.tipAmount}), 0)`.as(
          'total_tips'
        ),
      })
      .from(payment)
      .where(
        and(
          eq(payment.organizationId, organizationId),
          eq(payment.status, 'completed'),
          gte(payment.processedAt, from),
          lte(payment.processedAt, to),
          isNull(payment.deletedAt)
        )
      )
      .groupBy(payment.processedById);
  },

  /** Refund summary for a date range */
  refundSummary: async (from: Date, to: Date) => {
    const result = await db
      .select({
        count: sql<number>`count(*)`.as('count'),
        totalRefunded: sql<number>`coalesce(sum(${payment.amount}), 0)`.as(
          'total_refunded'
        ),
      })
      .from(payment)
      .where(
        and(
          eq(payment.organizationId, organizationId),
          eq(payment.status, 'refunded'),
          gte(payment.processedAt, from),
          lte(payment.processedAt, to),
          isNull(payment.deletedAt)
        )
      );
    return result[0] ?? { count: 0, totalRefunded: 0 };
  },

  /** Payments within a date range (for end-of-day reconciliation) */
  findByDateRange: (from: Date, to: Date) => {
    return db.query.payment.findMany({
      where: and(
        eq(payment.organizationId, organizationId),
        gte(payment.processedAt, from),
        lte(payment.processedAt, to),
        isNull(payment.deletedAt)
      ),
      with: {
        check: {
          with: { order: true },
        },
        processedBy: true,
      },
      orderBy: payment.processedAt,
    });
  },

  // ── Mutations ───────────────────────────────────────────────────────

  create: async (payload: InsertPaymentInputType) => {
    const [inserted] = await db
      .insert(payment)
      .values({ ...payload, organizationId })
      .returning();
    return inserted;
  },

  /** Mark a payment as refunded */
  refund: async (id: string) => {
    const [updated] = await db
      .update(payment)
      .set({ status: 'refunded' })
      .where(
        and(
          eq(payment.id, id),
          eq(payment.organizationId, organizationId),
          eq(payment.status, 'completed'),
          isNull(payment.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  /** Mark a payment as failed */
  fail: async (id: string) => {
    const [updated] = await db
      .update(payment)
      .set({ status: 'failed' })
      .where(
        and(
          eq(payment.id, id),
          eq(payment.organizationId, organizationId),
          isNull(payment.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },
});
