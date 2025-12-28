import { sql } from "drizzle-orm";
import { boolean, check, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";

import category from "./category";
import restaurant from "./restaurant";

const menuItem = pgTable("menu_item", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  restaurantId: integer("restaurant_id")
    .notNull()
    .references(() => restaurant.id, { onDelete: "cascade" }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => category.id),

  description: text("description").notNull(),
  ingredients: text("ingredients").notNull(),
  // Amount in cents. Easier to handle as integer to avoid floating point issues.
  amount: integer("amount").notNull(),
  active: boolean("active").notNull().default(true),

  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at"),
}, table => ([
  // Ensure amount is positive
  check("price_positive", sql`${table.amount} > 0`),
]));

export const MenuItemSelectSchema = createSelectSchema(menuItem);
export default menuItem;
