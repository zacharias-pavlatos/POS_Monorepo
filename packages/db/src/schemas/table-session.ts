/**
 * Table Session schemas - Runtime seating events + physical table mapping
 *
 * Core idea:
 * - table_session = the "visit/tab" (source of truth)
 * - table_session_table = membership HISTORY (merge / split / move)
 *
 * Capabilities this enables:
 * ✅ Session without a table (bar tab / takeaway / pre-seat)
 *    - Create a table_session with ZERO table_session_table rows.
 *    - Later attach 1+ physical tables by inserting membership rows.
 *
 * ✅ Join tables (T5 + T6)
 *    - Same session has multiple ACTIVE membership rows (leftAt = null).
 *
 * ✅ Split tables (remove T6)
 *    - Set leftAt on the membership row (keeps history).
 *
 * ✅ Move tables (T5 → T10)
 *    - Close membership for T5 (leftAt = now)
 *    - Create membership for T10 (leftAt = null)
 *
 * ✅ Concurrency safety (multi-PDA)
 *    - DB enforces: a physical table can be in ONLY ONE active session at a time.
 *      Implemented via a partial unique index:
 *        UNIQUE (organizationId, tableId) WHERE leftAt IS NULL AND deletedAt IS NULL
 *
 * Important:
 * - Orders should attach to tableSessionId (not tableId) so orders follow moves/merges.
 */

import {
  pgTable,
  text,
  uuid,
  varchar,
  integer,
  uniqueIndex,
  index,
  pgEnum,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

import { organization, user } from './auth-schema';
import { diningTable } from './table';
import { timestamps } from './helpers';
import { order } from './order';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Session lifecycle.
 * - active: ongoing visit/tab
 * - closed: completed (typically after payment)
 * - voided: cancelled (mistake/walkout/admin)
 */
export const tableSessionStatusEnum = pgEnum('table_session_status', [
  'active',
  'closed',
  'voided',
]);

/**
 * Optional: how this session started (helps UI + reporting)
 * - dine_in: normal seating
 * - tab: bar tab without assigned table (or assigned later)
 * - takeaway: pickup order (no table)
 * - delivery: delivery order (no table)
 */
export const tableSessionTypeEnum = pgEnum('table_session_type', [
  'dine_in',
  'tab',
  'takeaway',
  'delivery',
]);

// ============================================================================
// TABLES
// ============================================================================

/**
 * table_session = the stable "visit/tab".
 *
 * A session can exist WITHOUT a table (0 membership rows).
 * Tables are attached/detached using table_session_table rows.
 */
export const tableSession = pgTable(
  'table_session',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),

    status: tableSessionStatusEnum('status').notNull().default('active'),

    /** Session type (dine in / tab / takeaway / delivery) */
    type: tableSessionTypeEnum('type').notNull().default('dine_in'),

    /** Optional label (e.g., "VIP Dinner", "Birthday") */
    name: varchar('name', { length: 255 }),

    /** Guest count (covers) */
    guestCount: integer('guest_count').notNull().default(1),

    /** When the session started (timestamptz) */
    openedAt: timestamp('opened_at', { withTimezone: true }).notNull().defaultNow(),

    /** Who opened the session (optional) */
    openedByUserId: text('opened_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),

    /** When the session ended (timestamptz) */
    closedAt: timestamp('closed_at', { withTimezone: true }),

    /** Who closed the session (optional) */
    closedByUserId: text('closed_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),

    ...timestamps,
  },
  t => [
    index('idx_table_session_org_status').on(t.organizationId, t.status),
    index('idx_table_session_org_opened_at').on(t.organizationId, t.openedAt),
    index('idx_table_session_org_type').on(t.organizationId, t.type),
  ]
);

/**
 * table_session_table = membership history.
 *
 * joinedAt/leftAt forms a timeline of merge/split/move events.
 *
 * ACTIVE membership row:
 * - leftAt IS NULL
 *
 * History:
 * - When a table leaves the session, we set leftAt.
 * - We do NOT delete rows for normal moves/splits.
 */
export const tableSessionTable = pgTable(
  'table_session_table',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),

    tableSessionId: uuid('table_session_id')
      .notNull()
      .references(() => tableSession.id, { onDelete: 'cascade' }),

    tableId: uuid('table_id')
      .notNull()
      .references(() => diningTable.id, { onDelete: 'cascade' }),

    /** When this table joined the session (timestamptz) */
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),

    /** When this table left the session (timestamptz). null = currently active */
    leftAt: timestamp('left_at', { withTimezone: true }),

    /** Optional: who performed the join (move/merge) */
    joinedByUserId: text('joined_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),

    /** Optional: who performed the split/move away */
    leftByUserId: text('left_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),

    ...timestamps,
  },
  t => [
    /**
     * DB GUARANTEE (multi-terminal safe):
     * A physical table can belong to ONLY ONE active session at a time.
     *
     * This still allows joining tables:
     * - session S1 can have T5 + T6 active at once
     * but prevents:
     * - T5 active in S1 and S2 simultaneously
     */
    uniqueIndex('table_one_active_session_unique')
      .on(t.organizationId, t.tableId)
      .where(sql`${t.leftAt} is null and ${t.deletedAt} is null`),

    /* Fast: current tables in a session (leftAt null) */
    index('idx_session_tables_current').on(t.organizationId, t.tableSessionId, t.leftAt),

    /* Fast: history for one table */
    index('idx_session_table_history').on(t.organizationId, t.tableId, t.joinedAt),

    /* Fast: session timeline */
    index('idx_session_table_session_joined').on(
      t.organizationId,
      t.tableSessionId,
      t.joinedAt
    ),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const tableSessionRelations = relations(tableSession, ({ one, many }) => ({
  organization: one(organization, {
    fields: [tableSession.organizationId],
    references: [organization.id],
  }),

  /** All membership rows (includes history) */
  tables: many(tableSessionTable),

  /** Orders anchored to this session (order follows moves/merges/splits) */
  orders: many(order),
}));

export const tableSessionTableRelations = relations(tableSessionTable, ({ one }) => ({
  organization: one(organization, {
    fields: [tableSessionTable.organizationId],
    references: [organization.id],
  }),

  tableSession: one(tableSession, {
    fields: [tableSessionTable.tableSessionId],
    references: [tableSession.id],
  }),

  table: one(diningTable, {
    fields: [tableSessionTable.tableId],
    references: [diningTable.id],
  }),

  joinedBy: one(user, {
    fields: [tableSessionTable.joinedByUserId],
    references: [user.id],
    relationName: 'tableSessionTableJoinedBy',
  }),

  leftBy: one(user, {
    fields: [tableSessionTable.leftByUserId],
    references: [user.id],
    relationName: 'tableSessionTableLeftBy',
  }),
}));

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

export const SelectTableSessionSchema = createSelectSchema(tableSession);

export const InsertTableSessionSchema = createInsertSchema(tableSession, {
  name: field => field.max(255).optional().nullable(),
  guestCount: field => field.int().min(1).optional(),
}).omit({
  organizationId: true,
  openedAt: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const PatchTableSessionSchema = InsertTableSessionSchema.partial();

export const SelectTableSessionTableSchema = createSelectSchema(tableSessionTable);

export const InsertTableSessionTableSchema = createInsertSchema(tableSessionTable).omit({
  organizationId: true,
  joinedAt: true,
  leftAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const PatchTableSessionTableSchema = InsertTableSessionTableSchema.partial();

// ============================================================================
// TYPES
// ============================================================================

export type SelectTableSessionType = typeof tableSession.$inferSelect;
export type InsertTableSessionInputType = z.infer<typeof InsertTableSessionSchema>;
export type PatchTableSessionInputType = z.infer<typeof PatchTableSessionSchema>;

export type SelectTableSessionTableType = typeof tableSessionTable.$inferSelect;
export type InsertTableSessionTableInputType = z.infer<
  typeof InsertTableSessionTableSchema
>;
export type PatchTableSessionTableInputType = z.infer<
  typeof PatchTableSessionTableSchema
>;
