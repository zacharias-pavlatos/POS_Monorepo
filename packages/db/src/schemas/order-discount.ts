/**
 * Order Discount schema - Discount rules applied during service
 *
 * Rules-only design: stores WHAT discount is active, not the calculated amount.
 * Totals are computed live and cached on the order (recalculated on every mutation).
 * Final amounts are frozen on the check at payment time.
 *
 * Two scopes via orderItemId:
 * - Order-level (orderItemId = null): "10% off whole bill — regular customer"
 * - Item-level (orderItemId = set): "Comp the soup — waiter dropped it"
 *
 * Two sources via offerId:
 * - Catalog offer (offerId = set): auto-applied from the offer system
 * - Ad-hoc (offerId = null): manual discount by staff
 *
 * Offer fields are snapshotted so renaming/changing the offer doesn't
 * rewrite active order history.
 *
 * Revoke pattern instead of hard delete — who removed the discount, when, and why.
 */

import {
  pgTable,
  text,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

import { organization, user } from './auth-schema';
import { order, orderItem } from './order';
import { offer, discountTypeEnum } from './offer';
import { timestamps } from './helpers';

// ============================================================================
// TABLES
// ============================================================================

/**
 * Discount rules active on an order or specific item.
 *
 * Examples:
 *
 * Catalog offer (order-level):
 *   offerId: "offer_happy_hour", orderItemId: null
 *   offerNameSnapshot: "Happy Hour"
 *   discountType: "percentage", discountValue: 20
 *   prioritySnapshot: 10, isStackableSnapshot: true
 *
 * Ad-hoc order discount:
 *   offerId: null, orderItemId: null
 *   discountType: "percentage", discountValue: 10
 *   reason: "Regular customer"
 *   appliedById: "waiter_maria"
 *
 * Ad-hoc item comp:
 *   offerId: null, orderItemId: "item_soup"
 *   discountType: "percentage", discountValue: 100
 *   reason: "Waiter dropped it"
 *   appliedById: "waiter_maria", approvedById: "manager_kostas"
 *
 * Revoked discount:
 *   revokedAt: "2025-01-15T20:30:00Z"
 *   revokedById: "manager_kostas"
 *   revokeReason: "Applied to wrong order"
 */
export const orderDiscount = pgTable(
  'order_discount',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id')
      .notNull()
      .references(() => order.id, { onDelete: 'cascade' }),

    /**
     * Scope: order-level vs item-level.
     * - null: discount applies to the entire order
     * - set: discount applies to this specific item only
     */
    orderItemId: uuid('order_item_id').references(() => orderItem.id, {
      onDelete: 'cascade',
    }),

    // ── SOURCE ────────────────────────────────────────────────────────
    /**
     * Link to catalog offer if applicable.
     * - null: ad-hoc (manual) discount (e.g. waiter gives soup for free)
     * - set: discount originated from the offers table (e.g. happy hour)
     */
    offerId: uuid('offer_id').references(() => offer.id, { onDelete: 'set null' }),
    /** Offer name frozen at application time */
    offerNameSnapshot: varchar('offer_name_snapshot', { length: 255 }),

    // ── RULE SNAPSHOT ─────────────────────────────────────────────────

    /** Reuses the existing discount_type enum from the offer system */
    discountType: discountTypeEnum('discount_type').notNull(),
    /**
     * Discount rule value — interpretation depends on discountType:
     * - percentage: 20 = 20% off
     * - fixed_amount: 500 = €5.00 off (cents)
     * - fixed_price: 800 = set price to €8.00 (cents, item-level only)
     * - bogo: 50 = 50% off qualifying item
     */
    discountValue: integer('discount_value').notNull(),
    /** Priority at time of evaluation (from offer or manual assignment) */
    prioritySnapshot: integer('priority_snapshot').notNull().default(0),
    /** Whether this discount was stackable at time of application */
    isStackableSnapshot: boolean('is_stackable_snapshot').notNull().default(false),

    // ── ACCOUNTABILITY ────────────────────────────────────────────────

    /** Staff member who applied this discount (required) */
    appliedById: text('applied_by_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),

    /**
     * Manager who approved this discount.
     * Required for ad-hoc discounts above the waiter threshold.
     * Null = no approval needed (catalog-applied or within authority).
     */
    approvedById: text('approved_by_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    /** Human-readable reason (required for ad-hoc, optional for catalog) */
    reason: text('reason'),

    ...timestamps,
  },
  table => [
    /* Optimizes: Get all discounts for an order */
    index('idx_order_discount_order').on(table.organizationId, table.orderId),
    /* Optimizes: Get discounts for a specific item */
    index('idx_order_discount_item').on(table.organizationId, table.orderItemId),
    /* Optimizes: Track offer redemptions */
    index('idx_order_discount_offer').on(table.organizationId, table.offerId),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const orderDiscountRelations = relations(orderDiscount, ({ one }) => ({
  organization: one(organization, {
    fields: [orderDiscount.organizationId],
    references: [organization.id],
  }),
  order: one(order, {
    fields: [orderDiscount.orderId],
    references: [order.id],
  }),
  orderItem: one(orderItem, {
    fields: [orderDiscount.orderItemId],
    references: [orderItem.id],
  }),
  offer: one(offer, {
    fields: [orderDiscount.offerId],
    references: [offer.id],
  }),
  appliedBy: one(user, {
    fields: [orderDiscount.appliedById],
    references: [user.id],
    relationName: 'appliedBy',
  }),
  approvedBy: one(user, {
    fields: [orderDiscount.approvedById],
    references: [user.id],
    relationName: 'approvedBy',
  }),
}));

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

export const SelectOrderDiscountSchema = createSelectSchema(orderDiscount);
export const InsertOrderDiscountSchema = createInsertSchema(orderDiscount, {
  discountValue: field => field.int().min(0),
  reason: field => field.max(500).optional(),
}).omit({
  organizationId: true,
  offerNameSnapshot: true,
  prioritySnapshot: true,
  isStackableSnapshot: true,
  createdAt: true,
  updatedAt: true,
});

// ============================================================================
// TYPES
// ============================================================================

export type SelectOrderDiscountType = typeof orderDiscount.$inferSelect;
export type InsertOrderDiscountInputType = z.infer<typeof InsertOrderDiscountSchema>;

export default orderDiscount;
