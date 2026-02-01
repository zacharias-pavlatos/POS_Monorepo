/**
 * Product schema - Menu items for sale
 *
 * Products represent individual items customers can order.
 * They can have modifiers (sizes, toppings) and belong to multiple categories.
 */

import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { organization } from './auth-schema';
import { timestamps } from './helpers';
import { relations } from 'drizzle-orm';
import { modifierGroup } from './modifier';
import type { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { categoryProduct } from './category';

// ==========================================================================
// TABLES
// ==========================================================================

/**
 * Products are the actual items for sale.
 *
 * Examples:
 * - "Espresso" (basePrice: 300 = €3.00)
 * - "Cheeseburger" (basePrice: 850 = €8.50)
 * - "Caesar Salad" (basePrice: 950 = €9.50)
 */
export const product = pgTable(
  'product',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    /* Price is in cents to avoid floating point issues */
    basePrice: integer('base_price').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),

    ...timestamps,
  },
  table => [
    /* Optimizes: Get all active products for organization */
    index('idx_product_org_active').on(table.organizationId, table.isActive),
    /* Optimizes: Search products by name within organization */
    index('idx_product_org_name').on(table.organizationId, table.name),
  ]
);

// ==========================================================================
// RELATIONS
// ==========================================================================

export const productRelations = relations(product, ({ many }) => ({
  modifierGroups: many(modifierGroup), // Modifier groups for this product
  categories: many(categoryProduct), // Categories this product belongs to
}));

// ==========================================================================
// SCHEMA VALIDATION
// ==========================================================================

export const SelectProductSchema = createSelectSchema(product);
export const InsertProductSchema = createInsertSchema(product, {
  name: field => field.min(1).max(255),
  description: field => field.max(1000).optional(),
  basePrice: field => field.int().min(0),
  isActive: field => field.optional(),
}).omit({
  organizationId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export const PatchProductSchema = InsertProductSchema.partial();

// ==========================================================================
// TYPES
// ==========================================================================

export type SelectProductType = typeof product.$inferSelect;
export type InsertProductInputType = z.infer<typeof InsertProductSchema>;
export type PatchProductInputType = z.infer<typeof PatchProductSchema>;

export default product;
