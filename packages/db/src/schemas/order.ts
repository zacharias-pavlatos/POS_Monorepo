/**
 * Order schema - Core order system for restaurant POS
 *
 * Follows the Toast/Lightspeed industry standard:
 * - ONE order per table at a time
 * - Rounds (courses) within a single order for firing control
 * - Item-level status tracking for KDS (Kitchen Display System)
 * - Price snapshots at order time (denormalized from catalog)
 *
 * Order lifecycle:
 *   open → closed | voided
 *
 * Item lifecycle:
 *   new → sent → preparing → ready → served
 *                                       ↘ voided (at any point)
 *
 * History is tracked via the audit log, NOT in the order structure.
 */

import {
  pgTable,
  text,
  uuid,
  varchar,
  integer,
  pgEnum,
  index,
  timestamp,
  serial,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

import { organization, user } from './auth-schema';
import { timestamps } from './helpers';
import { diningTable } from './table';
import { product } from './product';
import { modifier } from './modifier';
import { tableSession } from './table-session';
import { orderDiscount } from './order-discount';
import { check, checkItem } from './check';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Order-level status.
 * - open: table is active, items can be added/modified
 * - closed: bill paid, table freed
 * - voided: entire order cancelled (e.g., walkout, mistake)
 */
export const orderStatusEnum = pgEnum('order_status', ['open', 'closed', 'voided']);

/**
 * Item-level status tracked independently for KDS routing.
 * - new: added to order, not yet sent to kitchen/bar
 * - sent: fired to the appropriate workstation
 * - preparing: kitchen/bar acknowledged, actively working
 * - ready: prepared and waiting for pickup
 * - served: delivered to the customer
 * - voided: cancelled (before or after preparation)
 */
export const orderItemStatusEnum = pgEnum('order_item_status', [
  'new',
  'sent',
  'preparing',
  'ready',
  'served',
  'voided',
]);

// ============================================================================
// TABLES
// ============================================================================

/**
 * Orders represent a single dining session at a table.
 *
 * One order per table at a time. Multiple waiters can add items
 * to the same order (synced via WebSocket). Rounds control firing.
 *
 * Example:
 *   Order #42 on Table T5 — opened by Maria at 19:00
 *   Round 1: 2× Beer, 1× Wine → fired to Bar
 *   Round 2: 1× Burger, 1× Salad → fired to Kitchen
 *   Round 3: 1× Espresso → fired to Bar
 *   Closed at 20:15 — total €34.50
 */
export const order = pgTable(
  'order',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    // tableId: uuid('table_id')
    //   .notNull()
    //   .references(() => diningTable.id, { onDelete: 'restrict' }),
    tableSessionId: uuid('table_session_id')
      .notNull()
      .references(() => tableSession.id, { onDelete: 'restrict' }),

    /**
     * Auto-incrementing order number per organization.
     * Used for display: "Order #42". Resets are NOT automatic —
     * use a separate sequence or daily counter if needed.
     */
    // TODO: Make this unique per organization
    orderNumber: serial('order_number').notNull(),

    /** Waiter who opened the order (first interaction with the table) */
    openedById: text('opened_by_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),

    status: orderStatusEnum('status').notNull().default('open'),

    /**
     * Tracks the current round number.
     * Incremented each time items are fired to kitchen/bar.
     * Items added before firing belong to the "current" (unfired) round.
     */
    currentRound: integer('current_round').notNull().default(1),

    /** Internal notes visible to staff (e.g., "Birthday party", "VIP guest") */
    notes: text('notes'),

    // ── TOTALS (stored in cents) ──────────────────────────────────────
    /** Sum of all non-voided item totals */
    subtotal: integer('subtotal').notNull().default(0),
    /** Total discount amount applied */
    discountTotal: integer('discount_total').notNull().default(0),
    /** Total tax amount */
    taxTotal: integer('tax_total').notNull().default(0),
    /** Final total: subtotal - discountTotal + taxTotal */
    total: integer('total').notNull().default(0),

    /** Number of guests at the table (for covers/per-head reporting) */
    guestCount: integer('guest_count').notNull().default(1),

    openedAt: timestamp('opened_at', { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp('closed_at', { withTimezone: true }),

    ...timestamps,
  },
  table => [
    // uniqueIndex('order_one_open_per_session')
    //   .on(table.tableSessionId)
    //   .where(sql`${table.status} = 'open' and ${table.deletedAt} is null`),

    /* One open order per session (enforce in app logic or partial unique if you want) */
    index('idx_order_session_status').on(table.tableSessionId, table.status),

    /* Optimizes: Get all orders for organization, most recent first */
    index('idx_order_org_opened').on(table.organizationId, table.openedAt),
    /* Optimizes: Get orders by status (e.g., all open orders for dashboard) */
    index('idx_order_org_status').on(table.organizationId, table.status),
    /* Optimizes: Get orders opened by a specific waiter */
    index('idx_order_opened_by').on(table.openedById),
  ]
);

/**
 * Order items — individual products within an order.
 *
 * Prices are SNAPSHOTTED at order time. If the catalog price changes
 * tomorrow, existing orders preserve the original pricing.
 *
 * Each item tracks its own status for KDS routing.
 * The order's overall status is derived from its items.
 *
 * Example:
 *   orderItem: "Margherita Pizza" — €8.50, round 1, status: served
 *   orderItem: "Draft Beer (Large)" — €5.00 + €1.00 size modifier, round 1, status: served
 *   orderItem: "Espresso" — €2.50, round 3, status: preparing
 */
export const orderItem = pgTable(
  'order_item',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id')
      .notNull()
      .references(() => order.id, { onDelete: 'cascade' }),
    /** Reference to the catalog product (for analytics, NOT for pricing) */
    productId: uuid('product_id')
      .notNull()
      .references(() => product.id, { onDelete: 'restrict' }),

    // ── SNAPSHOT FIELDS (frozen at order time) ────────────────────────

    /** Product name at time of ordering */
    productName: varchar('product_name', { length: 255 }).notNull(),
    /** Base product price at time of ordering (cents) */
    productPrice: integer('product_price').notNull(),
    /**
     * Unit price AFTER modifiers (cents).
     * productPrice + sum(modifier prices).
     * e.g., Beer €4.00 + Large size €1.00 = unitPrice €5.00 (500)
     */
    unitPrice: integer('unit_price').notNull(),
    /** Quantity ordered */
    quantity: integer('quantity').notNull().default(1),
    /**
     * Total for this line item (cents).
     * unitPrice × quantity.
     * e.g., 2× Large Beer = 500 × 2 = 1000
     */
    itemTotal: integer('item_total').notNull(),
    status: orderItemStatusEnum('status').notNull().default('new'),

    /**
     * Round number — set when items are fired.
     * Items start as null (unfired), then get assigned the
     * order's currentRound value when the waiter fires them.
     */
    round: integer('round'),

    /**
     * Optional seat number for easier check splitting.
     * "Seat 1 gets the burger, Seat 2 gets the salad."
     */
    seatNumber: integer('seat_number'),
    /** Waiter who added this item */
    addedById: text('added_by_id').references(() => user.id, { onDelete: 'set null' }),
    /** Item-level notes (e.g., "no onions", "extra spicy") */
    notes: text('notes'),
    /** When this item should become visible on the KDS. */
    firedAt: timestamp('fired_at', { withTimezone: true }),

    // ── VOID / CANCEL (accountability) ───────────────────────────────

    /** When this item was voided/cancelled */
    voidedAt: timestamp('voided_at', { withTimezone: true }),
    /** Staff member who voided/cancelled the item */
    voidedById: text('voided_by_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    /** Reason for void/cancel (required in UI policy) */
    voidReason: text('void_reason'),

    ...timestamps,
  },
  table => [
    /* Optimizes: Get all items for an order */
    index('idx_order_item_order').on(table.orderId),
    /* Optimizes: KDS — get items by status for workstation routing */
    index('idx_order_item_status').on(table.organizationId, table.status),
    /* Optimizes: Get items by round */
    index('idx_order_item_round').on(table.orderId, table.round),
    /* Optimizes: Analytics — product sales lookup */
    index('idx_order_item_product').on(table.organizationId, table.productId),
  ]
);

/**
 * Order item modifiers — modifier choices snapshotted at order time.
 *
 * Each modifier selection (size, topping, etc.) is frozen with its
 * name and price at the moment the item was added to the order.
 *
 * Example for "Large Draft Beer":
 *   orderItemModifier: "Large" — +€1.00 (from "Size" modifier group)
 *
 * Example for "Pizza with extras":
 *   orderItemModifier: "Extra Cheese" — +€1.50
 *   orderItemModifier: "Pepperoni" — +€2.00
 */
export const orderItemModifier = pgTable(
  'order_item_modifier',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    orderItemId: uuid('order_item_id')
      .notNull()
      .references(() => orderItem.id, { onDelete: 'cascade' }),

    /** Reference to the catalog modifier (for analytics, NOT for pricing) */
    modifierId: uuid('modifier_id')
      .notNull()
      .references(() => modifier.id, { onDelete: 'restrict' }),

    // ── SNAPSHOT FIELDS (frozen at order time) ────────────────────────
    /** Modifier name at time of ordering */
    modifierName: varchar('modifier_name', { length: 255 }).notNull(),
    /** Modifier price adjustment at time of ordering (cents) */
    modifierPrice: integer('modifier_price').notNull(),

    /** Quantity (usually 1, but supports "double cheese" = 2) */
    quantity: integer('quantity').notNull().default(1),

    ...timestamps,
  },
  table => [
    /* Optimizes: Get all modifiers for an order item */
    index('idx_order_item_modifier_item').on(table.orderItemId),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const orderRelations = relations(order, ({ one, many }) => ({
  organization: one(organization, {
    fields: [order.organizationId],
    references: [organization.id],
  }),
  tableSession: one(tableSession, {
    fields: [order.tableSessionId],
    references: [tableSession.id],
  }),
  openedBy: one(user, {
    fields: [order.openedById],
    references: [user.id],
  }),
  items: many(orderItem),
  discounts: many(orderDiscount),
  checks: many(check),
}));

export const orderItemRelations = relations(orderItem, ({ one, many }) => ({
  organization: one(organization, {
    fields: [orderItem.organizationId],
    references: [organization.id],
  }),
  order: one(order, {
    fields: [orderItem.orderId],
    references: [order.id],
  }),
  product: one(product, {
    fields: [orderItem.productId],
    references: [product.id],
  }),
  addedBy: one(user, {
    fields: [orderItem.addedById],
    references: [user.id],
  }),
  modifiers: many(orderItemModifier),
  discounts: many(orderDiscount),
  checkItems: many(checkItem),
}));
export const orderItemModifierRelations = relations(orderItemModifier, ({ one }) => ({
  organization: one(organization, {
    fields: [orderItemModifier.organizationId],
    references: [organization.id],
  }),
  orderItem: one(orderItem, {
    fields: [orderItemModifier.orderItemId],
    references: [orderItem.id],
  }),
  /** Reference to catalog modifier (for analytics) */
  modifier: one(modifier, {
    fields: [orderItemModifier.modifierId],
    references: [modifier.id],
  }),
}));

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

// Order
export const SelectOrderSchema = createSelectSchema(order);
export const InsertOrderSchema = createInsertSchema(order, {
  guestCount: field => field.int().min(1).optional(),
  notes: field => field.max(1000).optional(),
}).omit({
  organizationId: true,
  orderNumber: true,
  status: true,
  currentRound: true,
  subtotal: true,
  discountTotal: true,
  taxTotal: true,
  total: true,
  openedAt: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export const PatchOrderSchema = createInsertSchema(order, {
  guestCount: field => field.int().min(1).optional(),
  notes: field => field.max(1000).optional(),
})
  .pick({
    notes: true,
    guestCount: true,
  })
  .partial();

// OrderItem
export const SelectOrderItemSchema = createSelectSchema(orderItem);
export const InsertOrderItemSchema = createInsertSchema(orderItem, {
  quantity: field => field.int().min(1).optional(),
  seatNumber: field => field.int().min(1).optional().nullable(),
  notes: field => field.max(500).optional(),
}).omit({
  organizationId: true,
  status: true,
  round: true,
  firedAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

// OrderItemModifier
export const SelectOrderItemModifierSchema = createSelectSchema(orderItemModifier);
export const InsertOrderItemModifierSchema = createInsertSchema(orderItemModifier, {
  quantity: field => field.int().min(1).optional(),
}).omit({
  organizationId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

// ============================================================================
// TYPES
// ============================================================================

// Order
export type SelectOrderType = typeof order.$inferSelect;
export type InsertOrderInputType = z.infer<typeof InsertOrderSchema>;
export type PatchOrderInputType = z.infer<typeof PatchOrderSchema>;

// OrderItem
export type SelectOrderItemType = typeof orderItem.$inferSelect;
export type InsertOrderItemInputType = z.infer<typeof InsertOrderItemSchema>;

// OrderItemModifier
export type SelectOrderItemModifierType = typeof orderItemModifier.$inferSelect;
export type InsertOrderItemModifierInputType = z.infer<
  typeof InsertOrderItemModifierSchema
>;
