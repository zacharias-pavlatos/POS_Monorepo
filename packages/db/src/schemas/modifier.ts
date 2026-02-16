/**
 * Modifier schema - Product customization and options
 *
 * Modifiers allow products to have customizable options (sizes, toppings, extras).
 * Supports dynamic pricing and conditional visibility based on selections.
 */

import {
  uuid,
  boolean,
  integer,
  pgTable,
  text,
  varchar,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

import { organization } from './auth-schema';
import { timestamps } from './helpers';
import { product } from './product';

// ============================================================================
// TABLES
// ============================================================================

/**
 * Modifier groups define a collection of related options with selection rules.
 *
 * Examples:
 * - "Size" (required, min=1, max=1)
 * - "Toppings" (optional, min=0, max=5)
 * - "Coffee Blend" (required, min=1, max=1)
 */
export const modifierGroup = pgTable(
  'modifier_group',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => product.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),

    /** If true, customer must make a selection before adding to cart */
    isRequired: boolean('is_required').notNull().default(false),
    /** Minimum selections required (0 = optional, 1+ = required) */
    minSelections: integer('min_selections').notNull().default(0),
    /** Maximum selections allowed (null = unlimited for multi-select) */
    maxSelections: integer('max_selections'),
    /** UI display order (lower = first) */
    displayOrder: integer('display_order').notNull().default(0),

    ...timestamps,
  },
  table => [
    /* Optimizes: Get all modifier groups for a product */
    index('idx_modifier_group_product').on(table.productId),
    /* Optimizes: Get modifier groups ordered by display order */
    index('idx_modifier_group_order').on(table.productId, table.displayOrder),
  ]
);

/**
 * Individual modifier options within a group.
 *
 * Examples within "Toppings" group:
 * - "Cheese" (+$1.50)
 * - "Pepperoni" (+$2.00)
 * - "Mushrooms" (+$1.00, is_default=true)
 */
export const modifier = pgTable(
  'modifier',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    modifierGroupId: uuid('modifier_group_id')
      .notNull()
      .references(() => modifierGroup.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),

    /* Price adjustment when selected - stored in cents to avoid floating point issues */
    basePrice: integer('base_price').notNull().default(0),
    /** If true, pre-select this option in the UI */
    isDefault: boolean('is_default').notNull().default(false),
    /** If false, modifier is hidden from selection or out of stock */
    isActive: boolean('is_active').notNull().default(true),
    /** UI display order (lower = first) */
    displayOrder: integer('display_order').notNull().default(0),

    ...timestamps,
  },
  table => [
    /* Optimizes: Get all modifiers in a group */
    index('idx_modifier_group').on(table.modifierGroupId),
    /* Optimizes: Get modifiers ordered by display order */
    index('idx_modifier_order').on(table.modifierGroupId, table.displayOrder),
  ]
);

/**
 * Modifier Option Dependencies
 * ─────────────────────────────────────────────────────────────────────────────
 * Overrides price and/or visibility of a modifier based on another
 * modifier's selection
 *
 * Each dependency row says:
 *   "When THIS [dependsOnModifierId] is selected, apply this [price] and [isAvailable]
 *    to THIS [modifierId]"
 *
 * Only exceptions are stored — if no matching dependency row exists for the
 * current selection, the modifier uses its defaults:
 *   - price       → modifier.basePrice
 *   - isAvailable → true
 *
 * This means:
 *   - A price override row is only needed when the price DIFFERS from basePrice
 *   - A visibility row is only needed when the modifier should be HIDDEN (default is isAvailable: true)
 *   - Rows where price = basePrice AND isAvailable = true are redundant and should be omitted
 *
 * USE CASE 1: DYNAMIC PRICING
 * ─────────────────────────────────────────────────────────────────────────────
 * Coffee blend price varies by cup size. Ethiopia has basePrice = 50 (€0.50).
 *
 *   modifierId │ dependsOnModifierId │ price │ isAvailable
 *   ───────────┼─────────────────────┼───────┼─────────────
 *   Ethiopia   │ Medium              │  80   │ true
 *   Ethiopia   │ Large               │ 130   │ true
 *
 * → Customer selects Small  → No matching row → defaults: price=50 (€0.50)
 * → Customer selects Medium → Match found → price=80 (€0.80)
 * → Customer selects Large  → Match found → price=130 (€1.30)
 *
 * No row for Ethiopia+Small because the override price (50) would equal
 * basePrice (50) — the default already gives the correct result.
 *
 * USE CASE 2: CONDITIONAL VISIBILITY
 * ─────────────────────────────────────────────────────────────────────────────
 * Sugar type hidden when "No Sugar" is selected:
 *
 *   modifierId  │ dependsOnModifierId │ price │ isAvailable
 *   ────────────┼─────────────────────┼───────┼────────
 *   White Sugar │ No Sugar            │ 0     │ false
 *   Brown Sugar │ No Sugar            │ 0     │ false
 *   Stevia      │ No Sugar            │ 0     │ false
 *
 * → Customer selects "Sweet"  → White Sugar is visible
 * → Customer selects "No Sugar" → White Sugar is hidden
 *
 *
 * GROUP VISIBILITY (derived)
 * ─────────────────────────────────────────────────────────────────────────────
 * A group is visible if ANY of its modifiers resolves to isAvailable=true.
 * No separate table needed — the API resolves each modifier in the group
 * and hides the group when all resolve to isAvailable=false.
 *
 * RESOLUTION LOGIC
 * ─────────────────────────────────────────────────────────────────────────────
 * For each modifier:
 *   1. Find a dependency row where dependsOnModifierId matches a currently selected modifier
 *   2. If found → use that row's price and isAvailable values
 *   3. If not found → use modifier.basePrice and isAvailable=true
 *
 * For each group:
 *   1. Resolve all modifiers in the group
 *   2. If at least one resolves to isAvailable=true → group is visible
 *   3. If all resolve to isAvailable=false → group is hidden
 */

export const modifierOptionDependency = pgTable(
  'modifier_option_dependency',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),

    /** The modifier whose price/visibility is affected */
    modifierId: uuid('modifier_id')
      .notNull()
      .references(() => modifier.id, { onDelete: 'cascade' }),
    /** The modifier that triggers this dependency when selected */
    dependsOnModifierId: uuid('depends_on_modifier_id')
      .notNull()
      .references(() => modifier.id, { onDelete: 'cascade' }),

    /* Price to use when this dependency is active (overrides basePrice)- stored in cents to avoid floating point issues */
    price: integer('price').notNull().default(0),
    /** If false, the modifier is hidden/disabled */
    isAvailable: boolean('is_available').notNull().default(true),

    ...timestamps,
  },
  table => [
    /**
     * Ensures same dependency pair is unique per organization.
     * Prevents duplicate: (org A, modifier X → modifier Y) appearing twice.
     */
    unique('uq_mod_deps').on(
      table.organizationId,
      table.modifierId,
      table.dependsOnModifierId
    ),

    /* Optimizes: Get all dependencies affecting a modifier */
    index('idx_mod_deps_modifier').on(table.organizationId, table.modifierId),
    /* Optimizes: Get all dependencies triggered by a modifier */
    index('idx_mod_deps_depends_on').on(table.organizationId, table.dependsOnModifierId),
  ]
);

// ==========================================================================
// RELATIONS
// ==========================================================================

export const modifierGroupRelations = relations(modifierGroup, ({ one, many }) => ({
  organization: one(organization, {
    fields: [modifierGroup.organizationId],
    references: [organization.id],
  }),
  product: one(product, {
    fields: [modifierGroup.productId],
    references: [product.id],
  }),
  /* Modifier options in this group */
  modifiers: many(modifier),
}));

export const modifierRelations = relations(modifier, ({ one, many }) => ({
  organization: one(organization, {
    fields: [modifier.organizationId],
    references: [organization.id],
  }),
  modifierGroup: one(modifierGroup, {
    fields: [modifier.modifierGroupId],
    references: [modifierGroup.id],
  }),
  /** Dependencies where THIS modifier's price/visibility is affected */
  dependencies: many(modifierOptionDependency, { relationName: 'modifier' }),
  /** Dependencies where THIS modifier is the trigger */
  dependents: many(modifierOptionDependency, { relationName: 'dependsOn' }),
}));

export const modifierOptionDependencyRelations = relations(
  modifierOptionDependency,
  ({ one }) => ({
    organization: one(organization, {
      fields: [modifierOptionDependency.organizationId],
      references: [organization.id],
    }),
    /** The modifier being affected */
    modifier: one(modifier, {
      fields: [modifierOptionDependency.modifierId],
      references: [modifier.id],
      relationName: 'modifier',
    }),
    /** The modifier that triggers this dependency */
    dependsOnModifier: one(modifier, {
      fields: [modifierOptionDependency.dependsOnModifierId],
      references: [modifier.id],
      relationName: 'dependsOn',
    }),
  })
);

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

// ModifierGroup
export const SelectModifierGroupSchema = createSelectSchema(modifierGroup);
export const InsertModifierGroupSchema = createInsertSchema(modifierGroup, {
  name: field => field.min(1).max(255),
  description: field => field.max(1000).optional(),
  minSelections: field => field.int().min(0).optional(),
  maxSelections: field => field.int().min(1).optional().nullable(),
  displayOrder: field => field.int().min(0).optional(),
}).omit({
  organizationId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export const PatchModifierGroupSchema = InsertModifierGroupSchema.partial();

// Modifier
export const SelectModifierSchema = createSelectSchema(modifier);
export const InsertModifierSchema = createInsertSchema(modifier, {
  name: field => field.min(1).max(255),
  description: field => field.max(1000).optional(),
  basePrice: field => field.int().min(0).optional(),
  displayOrder: field => field.int().min(0).optional(),
}).omit({
  organizationId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export const PatchModifierSchema = InsertModifierSchema.partial();

// ModifierOptionDependency
export const SelectModifierOptionDependencySchema = createSelectSchema(
  modifierOptionDependency
);
export const InsertModifierOptionDependencySchema = createInsertSchema(
  modifierOptionDependency,
  {
    price: field => field.int().min(0).optional(),
  }
).omit({
  organizationId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export const PatchModifierOptionDependencySchema =
  InsertModifierOptionDependencySchema.partial();

// ============================================================================
// TYPES
// ============================================================================

// ModifierGroup
export type SelectModifierGroupType = z.infer<typeof SelectModifierGroupSchema>;
export type InsertModifierGroupInputType = z.infer<typeof InsertModifierGroupSchema>;
export type PatchModifierGroupInputType = z.infer<typeof PatchModifierGroupSchema>;

// Modifier
export type SelectModifierType = z.infer<typeof SelectModifierSchema>;
export type InsertModifierInputType = z.infer<typeof InsertModifierSchema>;
export type PatchModifierInputType = z.infer<typeof PatchModifierSchema>;

// ModifierOptionDependency
export type SelectModifierOptionDependencyType = z.infer<
  typeof SelectModifierOptionDependencySchema
>;
export type InsertModifierOptionDependencyInputType = z.infer<
  typeof InsertModifierOptionDependencySchema
>;
export type PatchModifierOptionDependencyInputType = z.infer<
  typeof PatchModifierOptionDependencySchema
>;
