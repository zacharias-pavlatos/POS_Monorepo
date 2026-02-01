# Database Schema Generation Prompt

You are creating a database schema for a multi-tenant restaurant POS system using Drizzle ORM with PostgreSQL. Follow these strict conventions and patterns:

## NAMING CONVENTIONS

### Tables
- **ALWAYS use SINGULAR names**: `product`, `category`, `modifier` (NOT plural)
- Snake case for database: `modifier_group`, `category_product`
- Camel case for TypeScript: `modifierGroup`, `categoryProduct`

### Relations
- Table const name + "Relations": `productRelations`, `categoryRelations`
- Property names:
  - `one()` → singular: `product`, `category`, `modifierGroup`
  - `many()` → plural: `products`, `categories`, `modifierGroups`

### Types
- Pattern: `Select[Table]Type`, `Insert[Table]InputType`, `Patch[Table]InputType`
- Examples:
```typescript
  export type SelectProductType = typeof product.$inferSelect;
  export type InsertProductInputType = z.infer<typeof InsertProductSchema>;
  export type PatchProductInputType = z.infer<typeof PatchProductSchema>;
```

### Schemas
- Pattern: `Select[Table]Schema`, `Insert[Table]Schema`, `Patch[Table]Schema`
- Examples: `SelectProductSchema`, `InsertProductSchema`, `PatchProductSchema`

## FILE STRUCTURE
```typescript
/**
 * [Table] schema - [Brief description]
 *
 * [2-3 sentence explanation of what this schema does]
 */

import { ... } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

import { organization } from './auth-schema';
import { timestamps } from './helpers';
// ... other imports

// ============================================================================
// ENUMS (if needed)
// ============================================================================

// ============================================================================
// TABLES
// ============================================================================

// ============================================================================
// RELATIONS
// ============================================================================

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

export default [mainTable];
```

## TABLE DEFINITIONS

### Main Table Pattern
```typescript
/**
 * [Table description - what it represents]
 *
 * Examples:
 * - "[Example 1]"
 * - "[Example 2]"
 * - "[Example 3]"
 */
export const [tableName] = pgTable(
  '[table_name]',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),

    // Field definitions with inline JSDoc comments
    /** [Field description] */
    fieldName: type('field_name').notNull(),

    ...timestamps,
  },
  (table) => [
    // Indexes and constraints with explanatory comments
    /**
     * [Why this constraint exists]
     * [What it prevents/allows]
     */
    uniqueIndex('table_org_field_unique').on(table.organizationId, table.field),
  ]
);
```

### Junction Table Pattern (Many-to-Many)
```typescript
/**
 * Junction table linking [TableA] <-> [TableB] (Many-to-Many)
 *
 * [Brief explanation of the relationship]
 *
 * Example: "[Real-world example]"
 * - One [A] can have multiple [B]
 * - One [B] can be in multiple [A]
 */
export const [tableA][TableB] = pgTable(
  '[table_a]_[table_b]',
  {
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    [tableA]Id: uuid('[table_a]_id')
      .notNull()
      .references(() => [tableA].id, { onDelete: 'cascade' }),
    [tableB]Id: uuid('[table_b]_id')
      .notNull()
      .references(() => [tableB].id, { onDelete: 'cascade' }),

    // Optional fields
    displayOrder: integer('display_order').notNull().default(0),

    ...timestamps,
  },
  (table) => [
    /**
     * Composite primary key prevents duplicate ([tableA] + [tableB]) pairs.
     * Allows: Same [A] with multiple [B], same [B] in multiple [A]
     * Prevents: Same ([A] + [B]) appearing twice
     */
    primaryKey({ columns: [table.[tableA]Id, table.[tableB]Id] }),
  ]
);
```

## MULTI-TENANT RULES

**CRITICAL**: Every table MUST have `organizationId`:
```typescript
organizationId: text('organization_id')
  .notNull()
  .references(() => organization.id, { onDelete: 'cascade' }),
```

**Indexing for multi-tenancy**:
- Always include `organizationId` in composite indexes
- Always include `organizationId` in unique constraints
```typescript
uniqueIndex('table_org_field_unique').on(table.organizationId, table.field),
index('idx_table_org_field').on(table.organizationId, table.field),
```

## FIELD COMMENT STYLES

### Inline JSDoc (for simple fields):
```typescript
/** Brief description */
fieldName: type('field_name').notNull(),
```

### Inline with details (for complex fields):
```typescript
/**
 * Field value interpretation:
 * - option1: explanation
 * - option2: explanation
 */
fieldName: type('field_name').notNull(),
```

### Common patterns:
```typescript
/** Price in cents to avoid floating point issues */
basePrice: integer('base_price').notNull().default(0),

/** UI display order (lower = first) */
displayOrder: integer('display_order').notNull().default(0),

/** If false, hidden or out of stock */
isActive: boolean('is_active').notNull().default(true),
```

## RELATIONS PATTERN
```typescript
// Main table relations
export const [table]Relations = relations([table], ({ one, many }) => ({
  // one() for foreign key references
  organization: one(organization, {
    fields: [[table].organizationId],
    references: [organization.id],
  }),
  // many() for reverse relationships
  [relatedItems]: many([relatedTable]), // Comment explaining what these are
}));

// Junction table relations
export const [tableA][TableB]Relations = relations([tableA][TableB], ({ one }) => ({
  [tableA]: one([tableA], {
    fields: [[tableA][TableB].[tableA]Id],
    references: [[tableA].id],
  }),
  [tableB]: one([tableB], {
    fields: [[tableA][TableB].[tableB]Id],
    references: [[tableB].id],
  }),
}));
```

## VALIDATION SCHEMAS

### Minimal (recommended):
```typescript
export const SelectProductSchema = createSelectSchema(product);
export const InsertProductSchema = createInsertSchema(product, {
  name: (field) => field.min(1).max(255),
  description: (field) => field.max(1000).optional(),
  basePrice: (field) => field.int().min(0),
}).omit({
  organizationId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export const PatchProductSchema = InsertProductSchema.partial();
```

**Validation rules**:
- Only add custom validation when needed
- Use arrow functions: `(field) => field...`
- Always omit: `organizationId`, `createdAt`, `updatedAt`, `deletedAt`
- Drizzle-zod auto-validates: enums, booleans, required fields, types

## PRICE HANDLING

**ALWAYS store prices in cents (integer)**:
```typescript
/** Price in cents to avoid floating point issues */
basePrice: integer('base_price').notNull().default(0),

// Examples in comments:
// - "Espresso" (basePrice: 300 = €3.00)
// - "Large" (basePrice: 100 = +€1.00)
```

## EXAMPLES IN COMMENTS

Always provide 2-3 real-world examples:
```typescript
/**
 * Products are the actual items for sale.
 *
 * Examples:
 * - "Espresso" (basePrice: 300 = €3.00)
 * - "Cheeseburger" (basePrice: 850 = €8.50)
 * - "Caesar Salad" (basePrice: 950 = €9.50)
 */
```

## COMMON INDEXES
```typescript
// Single field query optimization
index('idx_table_field').on(table.field),

// Multi-tenant composite (most common)
index('idx_table_org_field').on(table.organizationId, table.field),

// Ordering queries
index('idx_table_order').on(table.parentId, table.displayOrder),
```

## TIMESTAMPS

**ALWAYS include at the end**:
```typescript
...timestamps,
```

This adds: `createdAt`, `updatedAt`, `deletedAt` (soft delete)

## ENUMS
```typescript
/**
 * [Enum description]
 * - value1: [Explanation]
 * - value2: [Explanation]
 */
export const [name]Enum = pgEnum('[enum_name]', ['value1', 'value2']);
```

## TYPE EXPORTS

**Always group by table**:
```typescript
// ============================================================================
// TYPES
// ============================================================================

// [TableName]
export type Select[Table]Type = z.infer<typeof Select[Table]Schema>;
export type Insert[Table]InputType = z.infer<typeof Insert[Table]Schema>;
export type Patch[Table]InputType = z.infer<typeof Patch[Table]Schema>;

// [JunctionTable]
export type Select[Junction]Type = z.infer<typeof Select[Junction]Schema>;
export type Insert[Junction]InputType = z.infer<typeof Insert[Junction]Schema>;
export type Patch[Junction]InputType = z.infer<typeof Patch[Junction]Schema>;

export default [mainTable];
```

## COMPLETE EXAMPLE
```typescript
/**
 * Product schema - Menu items for sale
 *
 * Products represent individual items customers can order.
 * They can have modifiers (sizes, toppings) and belong to multiple categories.
 */

import { boolean, integer, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

import { organization } from './auth-schema';
import { timestamps } from './helpers';

// ============================================================================
// TABLES
// ============================================================================

/**
 * Products are the actual items for sale.
 *
 * Examples:
 * - "Espresso" (basePrice: 300 = €3.00)
 * - "Cheeseburger" (basePrice: 850 = €8.50)
 */
export const product = pgTable('product', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),

  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  /** Price in cents to avoid floating point issues */
  basePrice: integer('base_price').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),

  ...timestamps,
});

// ============================================================================
// RELATIONS
// ============================================================================

export const productRelations = relations(product, ({ many }) => ({
  modifierGroups: many(modifierGroup),
}));

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

export const SelectProductSchema = createSelectSchema(product);
export const InsertProductSchema = createInsertSchema(product, {
  name: (field) => field.min(1).max(255),
  basePrice: (field) => field.int().min(0),
}).omit({
  organizationId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export const PatchProductSchema = InsertProductSchema.partial();

// ============================================================================
// TYPES
// ============================================================================

export type SelectProductType = typeof product.$inferSelect;
export type InsertProductInputType = z.infer<typeof InsertProductSchema>;
export type PatchProductInputType = z.infer<typeof PatchProductSchema>;

export default product;
```

## CHECKLIST

When creating/modifying a schema, verify:
- [ ] All table names are SINGULAR
- [ ] organizationId exists on ALL tables
- [ ] All foreign keys have `{ onDelete: 'cascade' }`
- [ ] Multi-tenant indexes include organizationId
- [ ] Prices are stored as integers (cents)
- [ ] Inline JSDoc comments on all fields
- [ ] 2-3 real-world examples in table comments
- [ ] Relations defined for both directions
- [ ] Validation schemas with arrow functions
- [ ] Types follow naming pattern
- [ ] timestamps included
- [ ] export default [mainTable] at end
- [ ] Arrow functions for callbacks: `(table) =>`, `(field) =>`

Now generate the schema following ALL these patterns.
