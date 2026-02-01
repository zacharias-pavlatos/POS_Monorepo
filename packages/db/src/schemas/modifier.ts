import { relations } from 'drizzle-orm';
import {
  uuid,
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  varchar,
  unique,
  index,
} from 'drizzle-orm/pg-core';

import { organization } from './auth-schema';
import { timestamps } from './helpers';
import { products } from './product';

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
 */
export const modifierGroups = pgTable('modifier_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id),
  productId: uuid('product_id')
    .notNull()
 .references(() => products.id, { onDelete: 'cascade' }),

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
  (table) => [
    index('idx_modifier_groups_product').on(table.productId),
    index('idx_modifier_groups_order').on(table.productId, table.displayOrder),
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
export const modifiers = pgTable('modifiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id),
  modifierGroupId: uuid('modifier_group_id')
    .notNull()
    .references(() => modifierGroups.id, { onDelete: 'cascade' }),

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
  (table) => [
    index('idx_modifiers_group').on(table.modifierGroupId),
    index('idx_modifiers_order').on(table.modifierGroupId, table.displayOrder),
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

export const modifierOptionDependencies = pgTable(
  'modifier_option_dependencies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** The modifier whose price/visibility is affected */
    modifierId: uuid('modifier_id')
      .notNull()
      .references(() => modifiers.id, { onDelete: 'cascade' }),
    /** The modifier that triggers this dependency when selected */
    dependsOnModifierId: uuid('depends_on_modifier_id')
      .notNull()
      .references(() => modifiers.id, { onDelete: 'cascade' }),

    /* Price to use when this dependency is active (overrides priceAdjustment)- stored in cents to avoid floating point issues */
    price: integer('price').notNull().default(0),
    /** If false, the modifier is hidden/disabled */
    enabled: boolean('enabled').notNull().default(true),

    ...timestamps,
  },
  (table) => [
    unique('uq_mod_deps').on(table.modifierId, table.dependsOnModifierId),
    index('idx_mod_deps_modifier').on(table.modifierId),
    index('idx_mod_deps_depends_on').on(table.dependsOnModifierId),
  ]
);

// ==========================================================================
// RELATIONS
// ==========================================================================

export const modifierGroupsRelations = relations(modifierGroups, ({ one, many }) => ({
  product: one(products, {
    fields: [modifierGroups.productId],
    references: [products.id],
  }),
  modifiers: many(modifiers),
}));

export const modifiersRelations = relations(modifiers, ({ one, many }) => ({
  modifierGroup: one(modifierGroups, {
    fields: [modifiers.modifierGroupId],
    references: [modifierGroups.id],
  }),
  /** Dependencies where THIS modifier's price/visibility is affected */
  dependencies: many(modifierOptionDependencies, { relationName: 'modifier' }),
  /** Dependencies where THIS modifier is the trigger */
  dependents: many(modifierOptionDependencies, { relationName: 'dependsOn' }),
}));

export const modifierOptionDependenciesRelations = relations(
  modifierOptionDependencies,
  ({ one }) => ({
    /** The modifier being affected */
    modifier: one(modifiers, {
      fields: [modifierOptionDependencies.modifierId],
      references: [modifiers.id],
      relationName: 'modifier',
    }),
    /** The modifier that triggers this dependency */
    dependsOnModifier: one(modifiers, {
      fields: [modifierOptionDependencies.dependsOnModifierId],
      references: [modifiers.id],
      relationName: 'dependsOn',
    }),
  })
);

// ============================================================================
// TYPES
// ============================================================================

export type ModifierGroup = typeof modifierGroups.$inferSelect;
export type NewModifierGroup = typeof modifierGroups.$inferInsert;

export type Modifier = typeof modifiers.$inferSelect;
export type NewModifier = typeof modifiers.$inferInsert;

export type ModifierOptionDependency = typeof modifierOptionDependencies.$inferSelect;
export type NewModifierOptionDependency = typeof modifierOptionDependencies.$inferInsert;
