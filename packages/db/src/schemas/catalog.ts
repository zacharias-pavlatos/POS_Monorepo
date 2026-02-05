/**
 * Catalog schema - Menu collections and time-based menus
 *
 * Catalogs group categories into different menus (breakfast, lunch, dinner, seasonal).
 * Each catalog can have its own availability schedule.
 */

import {
  pgTable,
  text,
  uuid,
  varchar,
  integer,
  boolean,
  time,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

import { organization } from './auth-schema';
import { timestamps } from './helpers';
import { category } from './category';

// ============================================================================
// TABLES
// ============================================================================

/**
 * Catalogs represent different menu collections.
 *
 * Examples:
 * - "Breakfast Menu" (availableFrom: "06:00:00", availableUntil: "11:00:00")
 * - "Lunch Menu" (availableFrom: "11:00:00", availableUntil: "16:00:00")
 * - "Dinner Menu" (availableFrom: "17:00:00", availableUntil: "22:00:00")
 * - "All Day Menu" (availableFrom: null, availableUntil: null)
 */
export const catalog = pgTable(
  'catalog',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    /** Internal notes for staff (not shown to customers) */
    internalNotes: text('internal_notes'),

    /** Display order for catalog selection (lower = first) */
    displayOrder: integer('display_order').notNull().default(0),
    /** Daily availability start time "HH:MM:SS" (null = available from midnight) */
    availableFrom: time('available_from'),
    /** Daily availability end time "HH:MM:SS" (null = available until midnight) */
    availableUntil: time('available_until'),
    /** Days of the week when active: [0,1,2,3,4,5,6] (0=Sunday, 6=Saturday, null = all days) */
    activeDaysOfWeek: integer('active_days_of_week').array(),

    /** Catalog color for UI display (hex format, e.g., "#FF5733") */
    color: varchar('color', { length: 7 }),
    /** Catalog image URL or path */
    image: text('image'),
    /** Whether the catalog is currently active */
    isActive: boolean('is_active').notNull().default(true),

    ...timestamps,
  },
  table => [
    /**
     * Ensures catalog names are unique per organization.
     * Prevents duplicate catalogs like two "Breakfast Menu" in same restaurant.
     */
    uniqueIndex('catalog_org_name_unique').on(table.organizationId, table.name),

    /* Optimizes: Get all active catalogs for organization */
    index('idx_catalog_org_active').on(table.organizationId, table.isActive),
    /* Optimizes: Get catalogs ordered by display order */
    index('idx_catalog_org_order').on(table.organizationId, table.displayOrder),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const catalogRelations = relations(catalog, ({ one, many }) => ({
  organization: one(organization, {
    fields: [catalog.organizationId],
    references: [organization.id],
  }),
  /** Categories belonging to this catalog */
  categories: many(category),
}));

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

export const SelectCatalogSchema = createSelectSchema(catalog);
export const InsertCatalogSchema = createInsertSchema(catalog, {
  name: field => field.min(1).max(255),
  description: field => field.max(1000).optional(),
  internalNotes: field => field.max(1000).optional(),
  displayOrder: field => field.int().min(0).optional(),
  // TODO: Fix this
  activeDaysOfWeek: field => field.optional().nullable(),
  color: field =>
    field
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
      .optional()
      .nullable(),
  image: field => field.url('Invalid URL').optional().nullable(),
}).omit({
  organizationId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export const PatchCatalogSchema = InsertCatalogSchema.partial();

// ============================================================================
// TYPES
// ============================================================================

export type SelectCatalogType = z.infer<typeof SelectCatalogSchema>;
export type InsertCatalogInputType = z.infer<typeof InsertCatalogSchema>;
export type PatchCatalogInputType = z.infer<typeof PatchCatalogSchema>;

export default catalog;
