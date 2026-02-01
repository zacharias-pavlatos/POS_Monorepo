import { boolean, integer, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { organization } from "./auth-schema";
import { timestamps } from "./helpers";
import { relations } from "drizzle-orm/relations";
import { modifierGroups } from "./modifier";
import z from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// ==========================================================================
// TABLES
// ==========================================================================
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id),

  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  /* Price is in cents to avoid floating point issues */
  basePrice: integer('base_price').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),

  ...timestamps,
});

// ==========================================================================
// RELATIONS
// ==========================================================================
export const productsRelations = relations(products, ({ many }) => ({
  modifierGroups: many(modifierGroups),
}));

// ==========================================================================
// SCHEMA VALIDATION
// ==========================================================================
export const ProductSelectSchema = createSelectSchema(products);
export const ProductInsertSchema = createInsertSchema(products, {
  basePrice: z.coerce.number().positive(),
}).omit({
  organizationId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export const ProductUpdateSchema = ProductInsertSchema.partial();

// ==========================================================================
// TYPES
// ==========================================================================
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof ProductInsertSchema>;
export type UpdateProduct = z.infer<typeof ProductUpdateSchema>;
