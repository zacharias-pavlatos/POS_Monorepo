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

import type {
  InsertCategoryInputType,
  PatchCategoryInputType,
} from '../schemas/category';
import type { TenantContext } from './types';

export const categoryRepository = ({ db, organizationId }: TenantContext) => ({
  findAll: () => {
    return db.query.category.findMany({
      where: eq(category.organizationId, organizationId),
    });
  },

  findById: (id: string) => {
    return db.query.category.findFirst({
      where: and(eq(category.id, id), eq(category.organizationId, organizationId)),
    });
  },

  findByName: (name: string) => {
    return db.query.category.findFirst({
      where: eq(category.name, name),
    });
  },

  create: async (payload: InsertCategoryInputType) => {
    const [inserted] = await db
      .insert(category)
      .values({ ...payload, organizationId: organizationId })
      .returning();
    return inserted;
  },

  update: async (id: string, payload: PatchCategoryInputType) => {
    const [updated] = await db
      .update(category)
      .set(payload)
      .where(and(eq(category.id, id), eq(category.organizationId, organizationId)))
      .returning();
    return updated ?? null;
  },

  delete: async (id: string) => {
    const [deleted] = await db
      .delete(category)
      .where(and(eq(category.id, id), eq(category.organizationId, organizationId)))
      .returning();
    return deleted ?? null;
  },
});
