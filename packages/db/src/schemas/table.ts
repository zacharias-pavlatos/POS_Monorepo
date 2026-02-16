/**
 * Dining Table schema - Physical tables within restaurant areas
 *
 * Tables represent individual dining spots where customers sit.
 * Each table belongs to an area and can hold one active order at a time.
 *
 * Supports:
 * - Dynamic table creation (e.g., joining T5+T6 into "T5-6")
 * - Capacity tracking for seating management
 * - Per-area organization for floor plan layout
 *
 * NOTE: PG table name is "dining_table" because "table" is a reserved keyword.
 */

import {
  pgTable,
  text,
  uuid,
  varchar,
  integer,
  boolean,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

import { organization } from './auth-schema';
import { timestamps } from './helpers';
import { zone } from './zone';

// ============================================================================
// TABLES
// ============================================================================

/**
 * Dining tables within restaurant areas.
 *
 * Examples:
 * - "T1" (capacity: 2, zone: "Terrace")
 * - "T5-6" (capacity: 8, zone: "Ground Floor", merged tables)
 * - "Bar 1" (capacity: 1, zone: "Bar")
 */
export const diningTable = pgTable(
  'dining_table',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    zoneId: uuid('zone_id')
      .notNull()
      .references(() => zone.id, { onDelete: 'cascade' }),

    /** Short label shown in floor plan (e.g., "T1", "T5-6", "Bar 3") */
    label: varchar('label', { length: 50 }).notNull(),

    /** Maximum seating capacity */
    capacity: integer('capacity').notNull().default(4),
    /** Display order within the area (lower = first) */
    displayOrder: integer('display_order').notNull().default(0),

    /** Whether the table is currently available for seating */
    isActive: boolean('is_active').notNull().default(true),

    ...timestamps,
  },
  table => [
    /**
     * Ensures table labels are unique per organization.
     * Prevents duplicate labels like two "T1" in same restaurant.
     */
    uniqueIndex('table_org_label_unique').on(table.organizationId, table.label),

    /* Optimizes: Get all tables for an area */
    index('idx_table_zone').on(table.zoneId),
    /* Optimizes: Get all active tables for organization */
    index('idx_table_org_active').on(table.organizationId, table.isActive),
    /* Optimizes: Get tables ordered within area */
    index('idx_dining_table_zone_order').on(table.zoneId, table.displayOrder),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const tableRelations = relations(diningTable, ({ one }) => ({
  organization: one(organization, {
    fields: [diningTable.organizationId],
    references: [organization.id],
  }),
  zone: one(zone, {
    fields: [diningTable.zoneId],
    references: [zone.id],
  }),
}));

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

export const SelectDiningTableSchema = createSelectSchema(diningTable);
export const InsertDiningTableSchema = createInsertSchema(diningTable, {
  label: field => field.min(1).max(50),
  capacity: field => field.int().min(1).optional(),
  displayOrder: field => field.int().min(0).optional(),
}).omit({
  organizationId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export const PatchDiningTableSchema = InsertDiningTableSchema.partial();

// ============================================================================
// TYPES
// ============================================================================

export type SelectDiningTableType = z.infer<typeof SelectDiningTableSchema>;
export type InsertDiningTableInputType = z.infer<typeof InsertDiningTableSchema>;
export type PatchDiningTableInputType = z.infer<typeof PatchDiningTableSchema>;
