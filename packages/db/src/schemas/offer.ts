/**
 * Offer System - Restaurant Promotions & Discounts
 *
 * Supports:
 * - Happy hours (time-based discounts)
 * - BOGO deals (buy one get one)
 * - Category-wide offers (all drinks 20% off)
 * - Product-specific offers (espresso €1 off)
 * - Order-level discounts (€5 off orders over €30)
 * - Stackable and priority-based promotions
 */

import {
  pgTable,
  text,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  pgEnum,
  uniqueIndex,
  primaryKey,
  time,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

import { organization } from './auth-schema';
import { product } from './product';
import { category } from './category';
import { timestamps } from './helpers';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Discount type determines how the discount is calculated
 */
export const discountTypeEnum = pgEnum('discount_type', [
  'percentage', // 20% off
  'fixed_amount', // €5 off
  'fixed_price', // Set price to €10
  'bogo', // Buy one get one (percentage off on qualifying items)
]);

/**
 * Offer scope determines what the offer applies to
 */
export const offerScopeEnum = pgEnum('offer_scope', [
  'product', // Specific products only
  'category', // All products in category
  'order', // Entire order total
]);

// ============================================================================
// TABLES
// ============================================================================

/**
 * Offers define discounts, deals, and special promotions.
 *
 * Examples:
 * - Happy Hour: 20% off all drinks 5-7pm weekdays
 * - BOGO Burgers: Buy one burger, get one 50% off
 * - Summer Special: €5 off orders over €30
 * - Lunch Deal: Any pasta fixed price €8 (11am-3pm)
 */
export const offer = pgTable(
  'offer',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),

    /* Type of discount: percentage, fixed_amount, fixed_price, or bogo */
    discountType: discountTypeEnum('discount_type').notNull(),
    /**
     * Discount value - interpretation depends on discountType:
     * - percentage: 20 = 20% off
     * - fixed_amount: 500 = €5.00 off (in cents)
     * - fixed_price: 800 = €8.00 final price (in cents)
     * - bogo: 50 = 50% off second item, 100 = free second item
     */
    discountValue: integer('discount_value').notNull(),
    /* What the offer applies to (product/category/order) */
    scope: offerScopeEnum('scope').notNull(),

    /* Offer becomes active from this date */
    validFrom: timestamp('valid_from').notNull(),
    /* Offer expires on this date (null = no expiration) */
    validUntil: timestamp('valid_until'),
    /* Days of the week when active: [0,1,2,3,4,5,6] (0=Monday, 6=Sunday) */
    activeDaysOfWeek: integer('active_days_of_week').array(),
    /* Daily start time "HH:MM:SS" */
    startTime: time('start_time'),
    /* Daily end time "HH:MM:SS" */
    endTime: time('end_time'),

    /* Higher number = applied first */
    priority: integer('priority').notNull().default(0),
    /* Allow combining with other offers */
    isStackable: boolean('is_stackable').notNull().default(false),

    /* Whether the offer is currently active */
    isActive: boolean('is_active').notNull().default(true),
    /* Limit total uses (null = unlimited) */
    maxRedemptions: integer('max_redemptions'),
    /* Number of times the offer has been used */
    currentRedemptions: integer('current_redemptions').notNull().default(0),

    ...timestamps,
  },
  table => [
    /**
     * Ensures offer names are unique per organization.
     * Prevents duplicate offers like two "Happy Hour" offers in same restaurant.
     */
    uniqueIndex('offer_org_name_unique').on(table.organizationId, table.name),

    /* Optimizes: Get all active offers for organization */
    index('idx_offer_org_active').on(table.organizationId, table.isActive),
    /* Optimizes: Get offers by validity period */
    index('idx_offer_dates').on(table.validFrom, table.validUntil),
    /* Optimizes: Get offers ordered by priority */
    index('idx_offer_priority').on(table.priority),
  ]
);

/**
 * Junction table linking offers <-> categories (Many-to-Many)
 *
 * Links offers to categories when scope = 'category'.
 * Enables category-wide promotions.
 *
 * Example: "Happy Hour" offer (20% off) applies to "Drinks" and "Appetizers" categories
 * - One offer can target multiple categories
 * - One category can be in multiple offers
 */
export const offerCategory = pgTable(
  'offer_category',
  {
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    offerId: uuid('offer_id')
      .notNull()
      .references(() => offer.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => category.id, { onDelete: 'cascade' }),

    ...timestamps,
  },
  table => [
    /**
     * Allows: Same offer in multiple categories, same category in multiple offers
     * Prevents: Same (offer + category) pair appearing twice
     */
    primaryKey({ columns: [table.offerId, table.categoryId] }),

    /* Optimizes: Get all categories for an offer */
    index('idx_offer_category_org_offer').on(table.organizationId, table.offerId),
    /* Optimizes: Get all offers for a category */
    index('idx_offer_category_org_cat').on(table.organizationId, table.categoryId),
  ]
);

/**
 * Junction table linking offers <-> products (Many-to-Many)
 *
 * Links offers to specific products when scope = 'product'.
 * Enables product-specific promotions.
 *
 * Example: "Burger Night" offer (20% off) applies to "Classic Burger" and "Cheese Burger"
 * - One offer can target multiple products
 * - One product can be in multiple offers
 */
export const offerProduct = pgTable(
  'offer_product',
  {
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    offerId: uuid('offer_id')
      .notNull()
      .references(() => offer.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => product.id, { onDelete: 'cascade' }),

    ...timestamps,
  },
  table => [
    /**
     * Allows: Same offer in multiple products, same product in multiple offers
     * Prevents: Same (offer + product) pair appearing twice
     */
    primaryKey({ columns: [table.offerId, table.productId] }),

    /* Optimizes: Get all products for an offer */
    index('idx_offer_product_org_offer').on(table.organizationId, table.offerId),
    /* Optimizes: Get all offers for a product */
    index('idx_offer_product_org_prod').on(table.organizationId, table.productId),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const offerRelations = relations(offer, ({ many }) => ({
  categories: many(offerCategory), // Categories this offer targets
  products: many(offerProduct), // Products this offer targets
}));

export const offerCategoryRelations = relations(offerCategory, ({ one }) => ({
  offer: one(offer, {
    fields: [offerCategory.offerId],
    references: [offer.id],
  }),
  category: one(category, {
    fields: [offerCategory.categoryId],
    references: [category.id],
  }),
}));

export const offerProductRelations = relations(offerProduct, ({ one }) => ({
  offer: one(offer, {
    fields: [offerProduct.offerId],
    references: [offer.id],
  }),
  product: one(product, {
    fields: [offerProduct.productId],
    references: [product.id],
  }),
}));

// ==========================================================================
// SCHEMA VALIDATION
// ==========================================================================

export const SelectOfferSchema = createSelectSchema(offer);
export const InsertOfferSchema = createInsertSchema(offer, {
  name: field => field.min(1).max(255),
  description: field => field.max(1000).optional(),
  discountValue: field => field.int().min(0),
  priority: field => field.int().optional(),
  maxRedemptions: field => field.int().min(1).optional().nullable(),
}).omit({
  organizationId: true,
  currentRedemptions: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export const PatchOfferSchema = InsertOfferSchema.partial();

export const SelectOfferCategorySchema = createSelectSchema(offerCategory);
export const InsertOfferCategorySchema = createInsertSchema(offerCategory).omit({
  organizationId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export const PatchOfferCategorySchema = InsertOfferCategorySchema.partial();

export const SelectOfferProductSchema = createSelectSchema(offerProduct);
export const InsertOfferProductSchema = createInsertSchema(offerProduct).omit({
  organizationId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export const PatchOfferProductSchema = InsertOfferProductSchema.partial();

// ============================================================================
// TYPES
// ============================================================================

// Offer
export type SelectOfferType = typeof offer.$inferSelect;
export type InsertOfferInputType = z.infer<typeof InsertOfferSchema>;
export type PatchOfferInputType = z.infer<typeof PatchOfferSchema>;

// OfferCategory
export type SelectOfferCategoryType = typeof offerCategory.$inferSelect;
export type InsertOfferCategoryInputType = z.infer<typeof InsertOfferCategorySchema>;
export type PatchOfferCategoryInputType = z.infer<typeof PatchOfferCategorySchema>;

// OfferProduct
export type SelectOfferProductType = typeof offerProduct.$inferSelect;
export type InsertOfferProductInputType = z.infer<typeof InsertOfferProductSchema>;
export type PatchOfferProductInputType = z.infer<typeof PatchOfferProductSchema>;

export default offer;
