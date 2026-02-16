/**
 * Zone schema - Physical zones within a restaurant
 *
 * Areas represent distinct physical sections of a restaurant where tables
 * are located. Used for organizing table layout and floor plans.
 *
 * Examples:
 * - "Ground Floor" (indoor main dining)
 * - "Terrace" (outdoor seating)
 * - "Beach" (seasonal beachside area)
 * - "VIP Room" (private area)
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
import { diningTable } from './table';
// ============================================================================
// TABLES
// ============================================================================

/**
 * Areas represent physical zones of a restaurant.
 *
 * Examples:
 * - "Ground Floor" (displayOrder: 0, color: "#3498DB")
 * - "Terrace" (displayOrder: 1, color: "#2ECC71")
 * - "Beach" (displayOrder: 2, color: "#F39C12", seasonal)
 */
export const zone = pgTable(
  'zone',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),

    /** Display order in floor plan UI (lower = first) */
    displayOrder: integer('display_order').notNull().default(0),
    /** Area color for UI display (hex format, e.g., "#FF5733") */
    color: varchar('color', { length: 7 }),

    /** Whether the area is currently active (seasonal areas can be toggled) */
    isActive: boolean('is_active').notNull().default(true),

    ...timestamps,
  },
  table => [
    /**
     * Ensures area names are unique per organization.
     * Prevents duplicate areas like two "Terrace" in same restaurant.
     */
    uniqueIndex('zone_org_name_unique').on(table.organizationId, table.name),

    /* Optimizes: Get all active areas for organization */
    index('idx_zone_org_active').on(table.organizationId, table.isActive),
    /* Optimizes: Get areas ordered by display order */
    index('idx_zone_org_order').on(table.organizationId, table.displayOrder),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const zoneRelations = relations(zone, ({ one, many }) => ({
  organization: one(organization, {
    fields: [zone.organizationId],
    references: [organization.id],
  }),
  /** Tables located in this area */
  tables: many(diningTable),
}));

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

export const SelectZoneSchema = createSelectSchema(zone);
export const InsertZoneSchema = createInsertSchema(zone, {
  name: field => field.min(1).max(255),
  description: field => field.max(1000).optional(),
  displayOrder: field => field.int().min(0).optional(),
  color: field =>
    field
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
      .optional()
      .nullable(),
}).omit({
  organizationId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export const PatchZoneSchema = InsertZoneSchema.partial();

// ============================================================================
// TYPES
// ============================================================================

export type SelectZoneType = z.infer<typeof SelectZoneSchema>;
export type InsertZoneInputType = z.infer<typeof InsertZoneSchema>;
export type PatchZoneInputType = z.infer<typeof PatchZoneSchema>;
