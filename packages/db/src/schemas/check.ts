/**
 * Check & Payment schema - Billing, split bills, and payments
 *
 * Checks are created at billing time (when splitting / presenting the bill)
 * and remain floating until the first successful payment (freeze).
 * They are the frozen financial record of what was charged.
 *
 * Flow:
 *   During service → order + orderItem + orderDiscount (live, mutable)
 *   At payment     → check(s) + checkItem + checkDiscount + payment (frozen)
 *
 * Simple (no split): 1 check with all items, order discounts distributed.
 * Split by product:  N checks, items assigned to checks.
 * Split by seat:     N checks, items grouped by seat number.
 * Split by amount:   N checks with manual totals.
 * Mixed:             Any combination of the above.
 *
 * Check lifecycle:
 *   open → partially_paid → paid | voided
 *
 * Check discounts are applied AFTER splitting (e.g., "5% staff on Maria's check").
 * Order discounts are distributed proportionally across checks at creation time.
 */

import {
  pgTable,
  text,
  uuid,
  integer,
  pgEnum,
  index,
  timestamp,
  varchar,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

import { organization, user } from './auth-schema';
import { timestamps } from './helpers';
import { order, orderItem } from './order';
import { offer, discountTypeEnum } from './offer';
import { payment } from './payment';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Check-level status.
 * - open: bill presented, awaiting payment
 * - partially_paid: some payment received, balance remaining
 * - paid: fully settled
 * - voided: cancelled (e.g., manager comp, mistake)
 */
export const checkStatusEnum = pgEnum('check_status', [
  'open',
  'partially_paid',
  'paid',
  'voided',
]);

// ============================================================================
// TABLES
// ============================================================================

/**
 * Checks — created at billing time (split/present bill), frozen at first successful payment.
 *
 * Simple case (no split):
 *   Order #42 → Check #1 (all items, full total)
 *
 * Split by product:
 *   Order #42 → Check #1 (Seat 1: Burger, Beer — €13.50)
 *             → Check #2 (Seat 2: Salad, Wine — €16.00)
 *
 * Split by amount:
 *   Order #42 → Check #1 (€14.75 — half)
 *             → Check #2 (€14.75 — half)
 *
 * Totals are calculated at creation time and include:
 * - Proportionally distributed order-level discounts
 * - Item-level discounts that follow their items
 * - Any check-level discounts (checkDiscount rows)
 */
export const check = pgTable(
  'check',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id')
      .notNull()
      .references(() => order.id, { onDelete: 'cascade' }),

    /** 1..N per order */
    number: integer('number').notNull(),
    /** Display label (e.g., "Check 1", "Seat 1", "Alex's bill") */
    label: varchar('label', { length: 100 }),
    status: checkStatusEnum('status').notNull().default('open'),

    // ── FROZEN TOTALS (cents) ─────────────────────────────────────────

    /** Sum of assigned item totals */
    subtotal: integer('subtotal').notNull().default(0),
    /**
     * Total discount amount on this check.
     * Includes: proportionally distributed order discounts
     *         + item-level order discounts for items on this check
     *         + check-level discounts (checkDiscount rows)
     */
    discountTotal: integer('discount_total').notNull().default(0),
    /** Tax on this check */
    taxTotal: integer('tax_total').notNull().default(0),
    /** Final amount due: subtotal - discountTotal + taxTotal */
    total: integer('total').notNull().default(0),

    /** Waiter who created this check (may differ from order opener) */
    createdById: text('created_by_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),

    /** optimistic locking for split/move operations */
    version: integer('version').notNull().default(1),
    /** when set: check becomes immutable (first completed payment) */
    frozenAt: timestamp('frozen_at', { withTimezone: true }),
    /** when set: check is paid */
    paidAt: timestamp('paid_at', { withTimezone: true }),

    ...timestamps,
  },
  table => [
    uniqueIndex('check_order_number_unique').on(table.orderId, table.number),

    /* Optimizes: Get all checks for an order */
    index('idx_check_order').on(table.organizationId, table.orderId),
    /* Optimizes: Get open checks for organization (active bills) */
    index('idx_check_org_status').on(table.organizationId, table.status),
  ]
);

/**
 * Junction table assigning order items (or portions of them) to checks.
 *
 * Supports:
 * - Simple billing (all items on one check)
 * - Split by product
 * - Split by quantity (same item distributed across multiple checks)
 *
 * An order item may appear on multiple checks,
 * but only once per check.
 * Quantity sum validation is enforced in application logic.
 */
export const checkItem = pgTable(
  'check_item',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    checkId: uuid('check_id')
      .notNull()
      .references(() => check.id, { onDelete: 'cascade' }),
    orderItemId: uuid('order_item_id')
      .notNull()
      .references(() => orderItem.id, { onDelete: 'cascade' }),

    /** Quantity assigned to this check (supports splitting qty) */
    quantity: integer('quantity').notNull().default(1),

    ...timestamps,
  },
  table => [
    /* Prevent duplicate row for same item within the same check */
    uniqueIndex('check_item_check_order_item_unique').on(
      table.checkId,
      table.orderItemId
    ),

    /* Optimizes: Get all items on a check */
    index('idx_check_item_check').on(table.checkId),
    /* Optimizes: Find which check an item belongs to */
    index('idx_check_item_order_item').on(table.orderItemId),
    index('idx_check_item_org_check').on(table.organizationId, table.checkId),
    index('idx_check_item_org_order_item').on(table.organizationId, table.orderItemId),
  ]
);

/**
 * Check-level discounts — applied AFTER splitting, before or during payment.
 *
 * These discounts affect only a specific check (not the whole order).
 * They are applied after order-level discounts are distributed.
 *
 * Discounts can stack and respect priority rules (from catalog offers).
 * No revoke fields — remove row + recalculate + audit log.
 *
 * Once the check is frozen (first completed payment),
 * discount rows must no longer be modified.
 *
 * Examples:
 * - "5% staff discount on Maria's check only"
 * - "€3 off — manager comp on check 2"
 * - "10% off remaining bill after split"
 */
export const checkDiscount = pgTable(
  'check_discount',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    checkId: uuid('check_id')
      .notNull()
      .references(() => check.id, { onDelete: 'cascade' }),
    /** Link to catalog offer if applicable (null = ad-hoc) */
    offerId: uuid('offer_id').references(() => offer.id, { onDelete: 'set null' }),

    /** Offer name frozen at application time */
    offerNameSnapshot: varchar('offer_name_snapshot', { length: 255 }),
    /** Reuses the existing discount_type enum from the offer system */
    discountType: discountTypeEnum('discount_type').notNull(),
    /**
     * Discount rule value — interpretation depends on discountType:
     * - percentage: 5 = 5% off this check
     * - fixed_amount: 300 = €3.00 off this check (cents)
     */
    discountValue: integer('discount_value').notNull(),
    /** Final value after applying the discount to the check's total */
    computedAmount: integer('computed_amount').notNull(),

    /** Staff member who applied this discount */
    appliedById: text('applied_by_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    /** Manager who approved (if required) */
    approvedById: text('approved_by_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    /** Human-readable reason */
    reason: text('reason'),

    ...timestamps,
  },
  table => [
    /* Optimizes: Get all discounts for a check */
    index('idx_check_discount_check').on(table.organizationId, table.checkId),
    /* Optimizes: Track offer redemptions */
    index('idx_check_discount_offer').on(table.organizationId, table.offerId),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const checkRelations = relations(check, ({ one, many }) => ({
  organization: one(organization, {
    fields: [check.organizationId],
    references: [organization.id],
  }),
  order: one(order, {
    fields: [check.orderId],
    references: [order.id],
  }),
  createdBy: one(user, {
    fields: [check.createdById],
    references: [user.id],
  }),
  /** Items assigned to this check */
  items: many(checkItem),
  /** Check-level discounts (post-split) */
  discounts: many(checkDiscount),
  /** Payments made against this check */
  payments: many(payment),
}));

export const checkItemRelations = relations(checkItem, ({ one }) => ({
  check: one(check, {
    fields: [checkItem.checkId],
    references: [check.id],
  }),
  orderItem: one(orderItem, {
    fields: [checkItem.orderItemId],
    references: [orderItem.id],
  }),
}));

export const checkDiscountRelations = relations(checkDiscount, ({ one }) => ({
  organization: one(organization, {
    fields: [checkDiscount.organizationId],
    references: [organization.id],
  }),
  check: one(check, {
    fields: [checkDiscount.checkId],
    references: [check.id],
  }),
  offer: one(offer, {
    fields: [checkDiscount.offerId],
    references: [offer.id],
  }),
  appliedBy: one(user, {
    fields: [checkDiscount.appliedById],
    references: [user.id],
    relationName: 'checkDiscountAppliedBy',
  }),
  approvedBy: one(user, {
    fields: [checkDiscount.approvedById],
    references: [user.id],
    relationName: 'checkDiscountApprovedBy',
  }),
}));

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

// Check
export const SelectCheckSchema = createSelectSchema(check);
export const InsertCheckSchema = createInsertSchema(check, {
  label: field => field.max(100).optional(),
}).omit({
  organizationId: true,
  status: true,
  subtotal: true,
  discountTotal: true,
  taxTotal: true,
  total: true,
  version: true,
  frozenAt: true,
  paidAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export const PatchCheckSchema = createInsertSchema(check, {
  label: field => field.max(100).optional(),
})
  .pick({ label: true })
  .partial();

// CheckItem
export const SelectCheckItemSchema = createSelectSchema(checkItem);
export const InsertCheckItemSchema = createInsertSchema(checkItem).omit({
  organizationId: true,
  createdAt: true,
});

// CheckDiscount
export const SelectCheckDiscountSchema = createSelectSchema(checkDiscount);
export const InsertCheckDiscountSchema = createInsertSchema(checkDiscount, {
  discountValue: field => field.int().min(0),
  reason: field => field.max(500).optional(),
}).omit({
  organizationId: true,
  offerNameSnapshot: true,
  createdAt: true,
});

// ============================================================================
// TYPES
// ============================================================================

// Check
export type SelectCheckType = typeof check.$inferSelect;
export type InsertCheckInputType = z.infer<typeof InsertCheckSchema>;
export type PatchCheckInputType = z.infer<typeof PatchCheckSchema>;

// CheckItem
export type SelectCheckItemType = typeof checkItem.$inferSelect;
export type InsertCheckItemInputType = z.infer<typeof InsertCheckItemSchema>;

// CheckDiscount
export type SelectCheckDiscountType = typeof checkDiscount.$inferSelect;
export type InsertCheckDiscountInputType = z.infer<typeof InsertCheckDiscountSchema>;
