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
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

import { organization } from './auth-schema';
import { product } from './product';
import { timestamps } from './helpers';

// ============================================================================
// TABLES
// ============================================================================

/**
 * Categories group products for menu organization.
 *
 * Examples:
 * - "Drinks"
 * - "Main Courses"
 * - "Desserts"
 * - "Popular Items"
 */
export const category = pgTable(
  'category',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 255 }).notNull(),

    ...timestamps,
  },
  table => [
    /**
     * Ensures category names are unique per organization.
     * Prevents duplicate categories like two "Drinks" in same restaurant.
     */
    uniqueIndex('category_org_name_unique').on(table.organizationId, table.name),
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

    displayOrder: integer('display_order').notNull().default(0), // Product position within category

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

export const categoryRelations = relations(category, ({ many }) => ({
  products: many(categoryProduct), // Products in this category
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
