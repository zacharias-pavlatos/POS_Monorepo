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
  pgEnum,
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
// ENUMS
// ============================================================================

/**
 * Selection type for modifier groups
 * - single: Radio buttons, exactly one selection (exclusive choice)
 * - multiple: Checkboxes, multiple selections allowed
 */
export const selectionTypeEnum = pgEnum('selection_type', ['single', 'multiple']);

// ============================================================================
// TABLES
// ============================================================================

/**
 * Modifier groups define a collection of related options with selection rules.
 *
 * Examples:
 * - "Size" (single, required, min=1, max=1)
 * - "Toppings" (multi, optional, min=0, max=5)
 * - "Coffee Blend" (single, required, min=1, max=1)
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

    /** single = radio buttons, multi = checkboxes */
    selectionType: selectionTypeEnum('selection_type').notNull().default('single'),
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
 * Defines conditional relationships between modifiers for dynamic pricing
 * and visibility control.
 *
 * CONCEPT
 * ─────────────────────────────────────────────────────────────────────────────
 * Each row defines: "When [dependsOnModifierId] is selected,
 *                    apply this [price] and [enabled] to [modifierId]"
 *
 * USE CASE 1: DYNAMIC PRICING
 * ─────────────────────────────────────────────────────────────────────────────
 * Coffee variety price varies by cup size:
 *
 *   modifierId     │ dependsOnModifierId │ price │ enabled
 *   ───────────────┼─────────────────────┼───────┼─────────
 *   costa-rica     │ regular             │ 2.80  │ true
 *   costa-rica     │ xlarge              │ 3.80  │ true
 *
 * → Customer selects "Regular" → Costa Rica costs €2.80
 * → Customer selects "XLarge"  → Costa Rica costs €3.80
 *
 * USE CASE 2: CONDITIONAL VISIBILITY
 * ─────────────────────────────────────────────────────────────────────────────
 * Sugar type hidden when "No Sugar" is selected:
 *
 *   modifierId     │ dependsOnModifierId │ price │ enabled
 *   ───────────────┼─────────────────────┼───────┼─────────
 *   white-sugar    │ sweet               │ 0.00  │ true
 *   white-sugar    │ medium              │ 0.00  │ true
 *   white-sugar    │ none                │ 0.00  │ false   ← hidden
 *
 * → Customer selects "Sweet"  → White Sugar is visible
 * → Customer selects "None"   → White Sugar is hidden
 *
 * RESOLUTION LOGIC
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Get all dependencies for the modifier
 * 2. Find the one where `dependsOnModifierId` matches a selected modifier
 * 3. If found → use that row's `price` and `enabled`
 * 4. If not found → use modifier's default `priceAdjustment`, enabled = true
 *
 * GROUP VISIBILITY (derived)
 * ─────────────────────────────────────────────────────────────────────────────
 * A group is visible if ANY of its modifiers resolve to enabled = true.
 * No separate table needed.
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

    /* Price to use when this dependency is active (overrides priceAdjustment)- stored in cents to avoid floating point issues */
    price: integer('price').notNull().default(0),
    /** If false, the modifier is hidden/disabled */
    enabled: boolean('enabled').notNull().default(true),

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

export default modifierGroup;
