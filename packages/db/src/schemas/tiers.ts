import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  varchar,
} from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: serial('id').primaryKey(),

  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  basePrice: numeric('base_price', { precision: 10, scale: 2 }).notNull().default('0'),
});

export const optionGroups = pgTable('option_groups', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),

  name: varchar('name', { length: 255 }).notNull(),
  // single = radio, multiple = checkbox, quantity = grams/ml
  type: varchar('type', { length: 20 }).notNull(),
  required: boolean('required').notNull().default(false),
  maxSelections: integer('max_selections'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const options = pgTable('options', {
  id: serial('id').primaryKey(),
  optionGroupId: integer('option_group_id')
    .notNull()
    .references(() => optionGroups.id),

  name: varchar('name', { length: 255 }).notNull(),
  priceDelta: numeric('price_delta', { precision: 10, scale: 2 }).notNull().default('0'),
  // quantity support (Square measured modifiers)
  unit: varchar('unit', { length: 10 }), // g, ml, kg, l, pcs
  step: numeric('step', { precision: 10, scale: 2 }),
  sortOrder: integer('sort_order').notNull().default(0),
});

// ---- RELATIONS ----//

export const productsRelations = relations(products, ({ many }) => ({
  optionGroups: many(optionGroups),
}));

export const optionGroupsRelations = relations(optionGroups, ({ one, many }) => ({
  product: one(products, {
    fields: [optionGroups.productId],
    references: [products.id],
  }),
  options: many(options),
}));

export const optionsRelations = relations(options, ({ one }) => ({
  optionGroup: one(optionGroups, {
    fields: [options.optionGroupId],
    references: [optionGroups.id],
  }),
}));
