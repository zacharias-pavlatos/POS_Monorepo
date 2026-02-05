/**
 * Restaurant schema - Business locations for multi-tenant POS system
 *
 * Restaurants are 1:1 with organizations, containing business-specific
 * details like tax information, location, and contact details.
 */

import {
  boolean,
  index,
  numeric,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

import { organization } from './auth-schema';
import { timestamps } from './helpers';

// ============================================================================
// TABLES
// ============================================================================

/**
 * Restaurant business locations and tax information.
 *
 * Examples:
 * - "Pizza Paradise" (Italian, Athens, VAT: EL123456789)
 * - "Burger Haven" (American, Thessaloniki, VAT: EL987654321)
 * - "Sushi Central" (Japanese, Patras, VAT: EL456789123)
 */
export const restaurant = pgTable(
  'restaurant',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),

    // Basic Info
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    cuisineType: varchar('cuisine_type', { length: 100 }),
    website: text('website'),
    image: text('image'),

    // Tax & Legal
    /** ISO country code (e.g., "GR", "US", "DE") */
    countryCode: varchar('country_code', { length: 2 }).notNull(),
    /** VAT/Tax registration number */
    vatNumber: varchar('vat_number', { length: 50 }).notNull(),
    /** Tax office name/code for registration */
    taxOffice: varchar('tax_office', { length: 255 }).notNull(),
    /** Business profession/category for tax purposes */
    profession: varchar('profession', { length: 255 }).notNull(),
    /** ISO 4217 currency code (e.g., "EUR", "USD", "GBP") */
    currency: varchar('currency', { length: 3 }).notNull().default('EUR'),

    // Location
    state: varchar('state', { length: 100 }).notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    streetAddress: text('street_address').notNull(),
    zipCode: varchar('zip_code', { length: 20 }).notNull(),
    /** Geographic coordinates for mapping/delivery */
    longitude: numeric('longitude', { precision: 10, scale: 8 }).notNull(),
    latitude: numeric('latitude', { precision: 10, scale: 8 }).notNull(),

    // Contact
    phoneNumber: varchar('phone_number', { length: 50 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),

    /** If true, restaurant is temporarily closed/inactive */
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps,
  },
  table => [
    /**
     * Ensures one restaurant per organization.
     * Each organization can only have one restaurant record.
     */
    uniqueIndex('restaurant_org_unique').on(table.organizationId),

    /**
     * Ensures unique VAT numbers per organization (redundant but explicit).
     * Prevents duplicate tax registrations.
     */
    uniqueIndex('restaurant_org_vat_unique').on(table.organizationId, table.vatNumber),

    /**
     * Ensures unique email per organization.
     * Allows same email across different organizations.
     */
    uniqueIndex('restaurant_org_email_unique').on(table.organizationId, table.email),

    /* Optimizes: Location-based restaurant searches by city and state */
    index('idx_restaurant_location').on(table.city, table.state, table.countryCode),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const restaurantRelations = relations(restaurant, ({ one }) => ({
  organization: one(organization, {
    fields: [restaurant.organizationId],
    references: [organization.id],
  }),
}));
// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

export const SelectRestaurantSchema = createSelectSchema(restaurant);
export const InsertRestaurantSchema = createInsertSchema(restaurant, {
  name: field => field.min(1).max(255),
  description: field => field.max(1000).optional(),
  cuisineType: field => field.max(100).optional(),
  website: field => field.url().optional(),
  image: field => field.url().optional(),
  countryCode: field => field.length(2).toUpperCase(),
  vatNumber: field => field.min(1).max(50),
  taxOffice: field => field.min(1).max(255),
  profession: field => field.min(1).max(255),
  currency: field => field.length(3).toUpperCase(),
  state: field => field.min(1).max(100),
  city: field => field.min(1).max(100),
  streetAddress: field => field.min(1),
  zipCode: field => field.min(1).max(20),
  longitude: field =>
    field.refine(
      val => {
        const num = Number(val);
        return num >= -180 && num <= 180;
      },
      { message: 'Longitude must be between -180 and 180' }
    ),
  latitude: field =>
    field.refine(
      val => {
        const num = Number(val);
        return num >= -90 && num <= 90;
      },
      { message: 'Latitude must be between -90 and 90' }
    ),
  phoneNumber: field => field.min(1).max(50),
  email: field => field.email().max(255),
}).omit({
  organizationId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const PatchRestaurantSchema = InsertRestaurantSchema.partial();
// ============================================================================
// TYPES
// ============================================================================

export type SelectRestaurantType = typeof restaurant.$inferSelect;
export type InsertRestaurantInputType = z.infer<typeof InsertRestaurantSchema>;
export type PatchRestaurantInputType = z.infer<typeof PatchRestaurantSchema>;

export default restaurant;
