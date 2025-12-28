import type { z } from "zod";

import { boolean, integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Drizzle
const restaurant = pgTable("restaurant", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull().unique(),
  description: text(),
  cuisineType: text(),
  website: text(),

  tax_office: text().notNull(),
  vat_number: text().notNull().unique(),
  profession: text().notNull(),
  countryCode: text().notNull(),
  state: text().notNull(),
  city: text().notNull(),
  streetAddress: text().notNull(),
  zipCode: text().notNull(),
  disabled: boolean().notNull().default(false),

  longitude: numeric({ precision: 10, scale: 8 }).notNull(),
  latitude: numeric({ precision: 10, scale: 8 }).notNull(),

  phoneNumber: text().notNull(),
  email: text().notNull().unique(),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp(),
});

export default restaurant;

/* Zod schema generated from drizzle schema */
export const SelectRestaurantSchema = createSelectSchema(restaurant);
export const InsertRestaurantSchema = createInsertSchema(restaurant)
  // Excludes auto-generated fields that shouldn't provided.
  .omit({
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
  });
export const PatchRestaurantSchema = InsertRestaurantSchema.partial();

/* Type exports */
export type SelectRestaurant = z.infer<typeof SelectRestaurantSchema>;
export type InsertRestaurant = z.infer<typeof InsertRestaurantSchema>;
export type PatchRestaurant = z.infer<typeof PatchRestaurantSchema>;
