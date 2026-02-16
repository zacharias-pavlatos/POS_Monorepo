/**
 * Payment schema - Transactions against a check (bill)
 *
 * Represents monetary transactions used to settle a check.
 * A single check can have multiple payments (split tender, partial payments).
 *
 * Payment lifecycle:
 *   completed → refunded
 *             ↘ failed
 *
 * Examples:
 *   Check #1 (€34.50):
 *     Payment: card €30.00 + tip €5.00 (ref: "txn_abc123")
 *     Payment: cash €4.50 + tip €0.00
 *
 *   Check #2 (€16.00):
 *     Payment: card €16.00 + tip €3.00 (ref: "txn_def456")
 *
 * Notes:
 * - Payments should not be edited except for status transitions (e.g., refunded) and only via controlled flows.
 * - Refunds should create new records (or update status), never delete.
 * - The check becomes frozen on the first successful (completed) payment.
 */

import {
  pgTable,
  text,
  uuid,
  varchar,
  integer,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

import { organization, user } from './auth-schema';
import { check } from './check';
import { timestamps } from './helpers';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Supported payment methods.
 * Extendable depending on integrations (Stripe, terminal, etc.).
 */
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'card', 'other']);

/**
 * Payment status reflects transaction outcome.
 */
export const paymentStatusEnum = pgEnum('payment_status', [
  'completed', // Successfully processed
  'failed', // Authorization or processing failed
  'refunded', // Fully refunded (original payment reversed)
]);

// ============================================================================
// TABLES
// ============================================================================

/**
 * Individual monetary transaction applied to a check.
 *
 * A check can have:
 * - One payment (simple case)
 * - Multiple payments (split tender or partial payments)
 *
 * The check becomes fully paid when the sum of completed payments
 * reaches or exceeds the check total.
 */
export const payment = pgTable(
  'payment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    /** The check (bill) this payment applies to */
    checkId: uuid('check_id')
      .notNull()
      .references(() => check.id, { onDelete: 'cascade' }),

    /** Payment method used */
    method: paymentMethodEnum('method').notNull(),
    /** Transaction status */
    status: paymentStatusEnum('status').notNull().default('completed'),

    /** Payment amount in cents (excluding tip) */
    amount: integer('amount').notNull(),
    /** Tip amount in cents */
    tipAmount: integer('tip_amount').notNull().default(0),
    /** ISO currency code (default EUR) */
    currency: varchar('currency', { length: 3 }).notNull().default('EUR'),

    /** External processor reference (e.g. Stripe payment intent ID, terminal transaction ID, etc.) */
    externalReference: varchar('external_reference', { length: 255 }),

    /** Staff member who processed the payment */
    processedById: text('processed_by_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),

    /** When the payment was processed */
    processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  table => [
    /* Optimizes: Get all payments for a check */
    index('idx_payment_check').on(table.organizationId, table.checkId),

    /* Optimizes: Reporting by status */
    index('idx_payment_status').on(table.organizationId, table.status),

    /* Optimizes: Revenue reporting by time */
    index('idx_payment_processed_at').on(table.organizationId, table.processedAt),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const paymentRelations = relations(payment, ({ one }) => ({
  organization: one(organization, {
    fields: [payment.organizationId],
    references: [organization.id],
  }),
  check: one(check, {
    fields: [payment.checkId],
    references: [check.id],
  }),
  processedBy: one(user, {
    fields: [payment.processedById],
    references: [user.id],
  }),
}));

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

export const SelectPaymentSchema = createSelectSchema(payment);

export const InsertPaymentSchema = createInsertSchema(payment, {
  amount: field => field.int().min(0),
  tipAmount: field => field.int().min(0).optional(),
  externalReference: field => field.max(255).optional(),
}).omit({
  organizationId: true,
  status: true,
  processedAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

// ============================================================================
// TYPES
// ============================================================================

export type SelectPaymentType = typeof payment.$inferSelect;
export type InsertPaymentInputType = z.infer<typeof InsertPaymentSchema>;
