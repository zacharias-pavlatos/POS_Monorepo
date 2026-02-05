/**
 * Category schema - Menu organization and grouping
 *
 * Categories organize products into logical groups for menu navigation.
 * Products can belong to multiple categories (e.g., "Water" in both "Drinks" and "Popular").
 */

import {
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
  uuid,
  varchar,
  integer,
  index,
  timestamp,
  time,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

import { organization } from './auth-schema';
import { product } from './product';
import workstation from './workstation';
import catalog from './catalog';
import { timestamps } from './helpers';
import { offerCategory } from './offer';

// ============================================================================
// TABLES
// ============================================================================

/**
 * Categories group products for menu organization.
 *
 * Examples:
 * - "Starters" (servingOrder: 1, workstation: "Cold Kitchen")
 * - "Main Courses" (servingOrder: 2, workstation: "Main Kitchen")
 * - "Desserts" (servingOrder: 3, workstation: "Pastry Station")
 */
export const category = pgTable(
  'category',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    //TODO: Fix on cascade based on business logic
    catalogId: uuid('catalog_id')
      .references(() => catalog.id, { onDelete: 'cascade' })
      .notNull(),

    /** Workstation where products in this category are prepared (e.g., "Main Kitchen", "Cold Kitchen", "Bar") */
    workstationId: uuid('workstation_id')
      .notNull() // MANDATORY
      .references(() => workstation.id),

    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    /** Internal notes for staff (not shown to customers) */
    internalNotes: text('internal_notes'),
    /** Category color for UI display (hex format, e.g., "#FF5733") */
    color: varchar('color', { length: 7 }),
    /** Category image URL or path */
    image: text('image'),

    /** Serving order (lower = served first, e.g., starters=1, mains=2, desserts=3) */
    servingOrder: integer('serving_order').notNull().default(0),

    /* Category becomes active from this date */
    activeFrom: timestamp('active_from').notNull(),
    /* Category expires on this date (null = no expiration) */
    activeUntil: timestamp('active_until'),
    /* Days of the week when active: [0,1,2,3,4,5,6] (0=Monday, 6=Sunday) */
    activeDaysOfWeek: integer('active_days_of_week').array(),
    /* Daily start time "HH:MM:SS" */
    startTime: time('start_time'),
    /* Daily end time "HH:MM:SS" */
    endTime: time('end_time'),
    /* Category is active or not */
    isActive: boolean('is_active').notNull().default(true),

    ...timestamps,
  },
  table => [
    /**
     * Ensures category names are unique per organization.
     * Prevents duplicate categories like two "Drinks" in same restaurant.
     */
    uniqueIndex('category_org_name_unique').on(table.organizationId, table.name),

    /* Optimizes: Get all active categories for organization */
    index('idx_category_org_active').on(table.organizationId, table.isActive),
    /* Optimizes: Get categories ordered by serving order */
    index('idx_category_org_serving').on(table.organizationId, table.servingOrder),
    /* Optimizes: Get categories by workstation */
    index('idx_category_workstation').on(table.workstationId),
    /* Optimizes: Get all categories in a catalog ordered by serving order */
    index('idx_category_catalog_serving').on(table.catalogId, table.servingOrder),
  ]
);

/**
 * Junction table linking categories <-> products (Many-to-Many)
 *
 * Links products to categories for menu organization.
 *
 * Example: "Water" appears in both "Drinks" and "Popular Items" categories
 * - One product can belong to multiple categories
 * - One category can contain multiple products
 */
export const categoryProduct = pgTable(
  'category_product',
  {
    categoryId: uuid('category_id')
      .notNull()
      .references(() => category.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => product.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),

    /** Product position within category */
    displayOrder: integer('display_order').notNull().default(0),

    ...timestamps,
  },
  table => [
    /**
     * Composite primary key prevents duplicate (category + product) pairs.
     * Allows: Same product in multiple categories, same category with multiple products
     * Prevents: Same product appearing twice in the same category
     */
    primaryKey({ columns: [table.categoryId, table.productId] }),

    // Optimizes: "Get all products in this category for this organization"
    index('idx_category_product_org_cat').on(table.organizationId, table.categoryId),
    // Optimizes: "Get all categories containing this product for this organization"
    index('idx_category_product_org_prod').on(table.organizationId, table.productId),
    // Optimizes: "Get products ordered by displayOrder within a category"
    index('idx_category_product_order').on(table.categoryId, table.displayOrder),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const categoryRelations = relations(category, ({ one, many }) => ({
  organization: one(organization, {
    fields: [category.organizationId],
    references: [organization.id],
  }),
  catalog: one(catalog, {
    fields: [category.catalogId],
    references: [catalog.id],
  }),
  workstation: one(workstation, {
    fields: [category.workstationId],
    references: [workstation.id],
  }),
  products: many(categoryProduct), // Products in this category
  offers: many(offerCategory),
}));

export const categoryProductRelations = relations(categoryProduct, ({ one }) => ({
  category: one(category, {
    fields: [categoryProduct.categoryId],
    references: [category.id],
  }),
  product: one(product, {
    fields: [categoryProduct.productId],
    references: [product.id],
  }),
}));

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

export const SelectCategorySchema = createSelectSchema(category);
export const InsertCategorySchema = createInsertSchema(category, {
  name: field => field.min(1).max(255),
  description: field => field.max(1000).optional(),
  internalNotes: field => field.max(1000).optional(),
  servingOrder: field => field.int().min(0).optional(),
  // TODO: Fix this
  activeDaysOfWeek: field => field.optional().nullable(),
  color: field =>
    field
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
      .optional()
      .nullable(),
  image: field => field.optional().nullable(),
}).omit({
  organizationId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export const PatchCategorySchema = InsertCategorySchema.partial();

export const SelectCategoryProductSchema = createSelectSchema(categoryProduct);
export const InsertCategoryProductSchema = createInsertSchema(categoryProduct, {
  displayOrder: field => field.int().min(0).optional(),
}).omit({
  organizationId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export const PatchCategoryProductSchema = InsertCategoryProductSchema.partial();

// ============================================================================
// TYPES
// ============================================================================

// Category
export type SelectCategoryType = z.infer<typeof SelectCategorySchema>;
export type InsertCategoryInputType = z.infer<typeof InsertCategorySchema>;
export type PatchCategoryInputType = z.infer<typeof PatchCategorySchema>;

// CategoryProduct
export type SelectCategoryProductType = z.infer<typeof SelectCategoryProductSchema>;
export type InsertCategoryProductInputType = z.infer<typeof InsertCategoryProductSchema>;
export type PatchCategoryProductInputType = z.infer<typeof PatchCategoryProductSchema>;

export default category;
