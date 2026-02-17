/**
 * Workstation schema - Kitchen and preparation stations
 *
 * Work stations represent physical areas where food/drinks are prepared.
 * Categories are assigned to stations for proper order routing.
 *
 * Info:
 * Every category has a mandatory workstation (e.g., "Desserts" → "Bar station")
 * Products can optionally override to always go to a specific station (e.g., "Draft Beer" → "Bar station")
 * despite the category's workstation.
 *
 * In the future if need:
 * By adding a workstationId to the categoryProduct junction table - allows the same product
 * to route to different workstations depending on which category it's ordered from
 * (e.g., "Chicken Nuggets" → Kids Station when ordered from Kids Menu, Main Kitchen
 * when ordered from Appetizers).
 */

import {
  pgTable,
  text,
  uuid,
  varchar,
  integer,
  uniqueIndex,
  index,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

import { organization } from './auth-schema';
import { timestamps } from './helpers';
import { category } from './category';
import product from './product';

// ============================================================================
// TABLES
// ============================================================================

/**
 * Work stations represent kitchen/bar preparation areas.
 *
 * Examples:
 * - "Main Kitchen" (color: "#FF5733")
 * - "Cold Kitchen" (color: "#3498DB")
 * - "Bar" (color: "#9B59B6")
 */
export const workstation = pgTable(
  'workstation',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    /** Display order in kitchen display system (lower = first) */
    displayOrder: integer('display_order').notNull().default(0),
    /** Station color for order routing UI (hex format, e.g., "#FF5733") */
    color: varchar('color', { length: 7 }),

    /** Whether the station is currently active */
    isActive: boolean('is_active').notNull().default(true),

    ...timestamps,
  },
  table => [
    /**
     * Ensures work station names are unique per organization.
     * Prevents duplicate stations like two "Bar" in same restaurant.
     */
    uniqueIndex('workstation_org_name_unique').on(table.organizationId, table.name),

    /* Optimizes: Get all active work stations for organization */
    index('idx_workstation_org_active').on(table.organizationId, table.isActive),
    /* Optimizes: Get workstations ordered by display order */
    index('idx_workstation_org_order').on(table.organizationId, table.displayOrder),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const workstationRelations = relations(workstation, ({ many }) => ({
  categories: many(category), // Categories assigned to this station
  products: many(product), // Products assigned to this station
}));

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

export const SelectWorkStationSchema = createSelectSchema(workstation);
export const InsertWorkStationSchema = createInsertSchema(workstation, {
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
export const PatchWorkStationSchema = InsertWorkStationSchema.partial();

// ============================================================================
// TYPES
// ============================================================================

export type SelectWorkStationType = z.infer<typeof SelectWorkStationSchema>;
export type InsertWorkStationInputType = z.infer<typeof InsertWorkStationSchema>;
export type PatchWorkStationInputType = z.infer<typeof PatchWorkStationSchema>;
