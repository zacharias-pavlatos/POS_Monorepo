/**
 * Table Session schemas - Runtime seating events + physical table mapping
 *
 * Implements:
 * - table_session: one continuous seating/service event
 * - table_session_table: maps physical tables to a session (merge/move/grouping)
 *
 * Notes:
 * - A physical table should belong to at most one ACTIVE table_session at a time.
 *   This is typically enforced in application logic via transaction checks.
 */

import {
  pgTable,
  text,
  uuid,
  varchar,
  integer,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

import { organization } from './auth-schema';
import { table } from './table';
import { timestamps } from './helpers';

// ============================================================================
// TABLES
// ============================================================================

export const tableSession = pgTable(
  'table_session',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),

    /**
     * Lifecycle status
     * - active: ongoing seating
     * - closed: fully completed (paid & done)
     */
    status: varchar('status', { length: 20 }).notNull().default('active'),
    /** Optional label (e.g., "VIP Dinner", "Birthday") */
    name: varchar('name', { length: 255 }),
    /** Guest count at start (can be updated during service) */
    guestCount: integer('guest_count').notNull().default(1),
    /** Optional: who opened the session (string because Better Auth org/user ids are text) */
    openedByUserId: text('opened_by_user_id'),

    ...timestamps,
  },
  t => [
    index('idx_table_session_org_status').on(t.organizationId, t.status),
    index('idx_table_session_org_created').on(t.organizationId, t.createdAt),
  ]
);

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
      .references(() => table.id, { onDelete: 'cascade' }),

    ...timestamps,
  },
  t => [
    // Prevent duplicate mapping of the same physical table to the same session
    uniqueIndex('table_session_table_unique').on(t.tableSessionId, t.tableId),

    // Fast lookup: what session is this table linked to?
    index('idx_table_session_table_table').on(t.organizationId, t.tableId),

    // Fast lookup: all tables in a given session
    index('idx_table_session_table_session').on(t.organizationId, t.tableSessionId),
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
  tables: many(tableSessionTable),
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
  table: one(table, {
    fields: [tableSessionTable.tableId],
    references: [table.id],
  }),
}));

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

export const SelectTableSessionSchema = createSelectSchema(tableSession);
export const InsertTableSessionSchema = createInsertSchema(tableSession, {
  name: field => field.max(255).optional().nullable(),
  guestCount: field => field.int().min(1).optional(),
  status: field => field.optional(), // you can restrict this further if you later add pgEnum
}).omit({
  organizationId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export const PatchTableSessionSchema = InsertTableSessionSchema.partial();

export const SelectTableSessionTableSchema = createSelectSchema(tableSessionTable);
export const InsertTableSessionTableSchema = createInsertSchema(tableSessionTable).omit({
  organizationId: true,
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

export default tableSession;
