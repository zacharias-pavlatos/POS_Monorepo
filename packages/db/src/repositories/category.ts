/**
 * Creates a category repository bound to the given database connection.
 *
 * This factory pattern allows dependency injection while providing a convenient
 * default. Instead of hardcoding the database connection, the repository receives
 * it as a parameter — enabling flexibility without sacrificing ease of use.
 *
 * Use cases for passing a custom db:
 * - **Transactions** — pass `tx` to group operations atomically
 * - **Testing** — inject a mock database without module mocking
 * - **Multi-tenancy** — use tenant-specific database connections
 *
 * When no argument is provided, the default database connection is used.
 */

import { and, eq } from 'drizzle-orm';

import category from '../schemas/category';

import type { DatabaseInstance } from '../client';
import type {
  InsertCategoryInputType,
  PatchCategoryInputType,
} from '../schemas/category';

export interface TenantContext {
  db: DatabaseInstance;
  organizationId: string;
}

export const categoryRepository = ({ db, organizationId }: TenantContext) => ({
  findAll: () => {
    return db.query.category.findMany({
      where: eq(category.organizationId, organizationId),
    });
  },

  findById: (id: number) => {
    return db.query.category.findFirst({
      where: and(eq(category.id, id), eq(category.organizationId, organizationId)),
    });
  },

  findByName: (name: string) => {
    return db.query.category.findFirst({
      where: eq(category.name, name),
    });
  },

  create: async (data: InsertCategoryInputType) => {
    const [inserted] = await db
      .insert(category)
      .values({ ...data, organizationId: organizationId })
      .returning();
    return inserted;
  },

  update: async (id: number, data: PatchCategoryInputType) => {
    const [updated] = await db
      .update(category)
      .set(data)
      .where(and(eq(category.id, id), eq(category.organizationId, organizationId)))
      .returning();
    return updated ?? null;
  },

  delete: async (id: number) => {
    const [deleted] = await db
      .delete(category)
      .where(and(eq(category.id, id), eq(category.organizationId, organizationId)))
      .returning();
    return deleted ?? null;
  },
});
