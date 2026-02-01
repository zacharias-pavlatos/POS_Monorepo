/**
 * Category database table and validation schemas.
 *
 * Defines how categories are stored and validated across two layers:
 *
 * Database Layer: PostgreSQL table with constraints for data integrity
 * API Layer: Zod schemas for request/response validation
 *
 * Two-Layer Validation Strategy:
 * - Zod (API Level): Fast validation with clear error messages, instant user feedback
 * - Database Constraints: Final safety net to protect data integrity
 *
 * Why both layers?
 * - Catches errors early before hitting the database
 * - Returns friendly error messages (422 status) instead of cryptic DB errors
 * - Enables stricter API validation rules than database allows
 * - Ensures consistent validation across all endpoints
 */

import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

import { organization } from './auth-schema';

import type { z } from 'zod';

/**
 * Database Layer - Category table structure with constraints.
 *
 * Defines the PostgreSQL table with columns and constraints to ensure
 * data integrity at the database level.
 */

export const category = pgTable(
  'category',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  table => [
    /**
     * IMPORTANT:
     * Name must be unique per organization, not globally.
     */
    uniqueIndex('category_org_name_unique').on(table.organizationId, table.name),
  ]
);

/**
 * API Layer - Request validation Zod schema.
 *
 * Validates user input before it reaches the database.
 * Enforces stricter rules than database constraints for better user experience:
 */
export const SelectCategorySchema = createSelectSchema(category);
export const InsertCategorySchema = createInsertSchema(category, {
  // Database allows up to 255, but we can provide clearer errors here.
  name: field => field.min(1).max(500),
})
  // Excludes auto-generated fields that clients shouldn't provide.
  .omit({
    organizationId: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
  });
export const PatchCategorySchema = InsertCategorySchema.partial();

export type SelectCategoryType = z.infer<typeof SelectCategorySchema>;
export type InsertCategoryInputType = z.infer<typeof InsertCategorySchema>;
export type PatchCategoryInputType = z.infer<typeof PatchCategorySchema>;

export default category;
