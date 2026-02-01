import { and, eq } from 'drizzle-orm';

import { products } from '../schemas/product';

import type { InsertProduct, UpdateProduct } from '../schemas/product';
import type { TenantContext } from './types';

export const productRepository = ({ db, organizationId }: TenantContext) => ({
  findAll: async () => {
    return db.query.products.findMany({
      where: eq(products.organizationId, organizationId),
    });
  },

  findById: async (id: string) => {
    return db.query.products.findFirst({
      where: and(eq(products.id, id), eq(products.organizationId, organizationId)),
    });
  },

  create: async (payload: InsertProduct) => {
    const [inserted] = await db.insert(products)
      .values({ ...payload, organizationId: organizationId })
      .returning();
    return inserted;
  },

  update: async (id: string, payload: UpdateProduct) => {
    const [updated] = await db
      .update(products)
      .set( payload)
      .where(and(eq(products.id, id), eq(products.organizationId, organizationId)))
      .returning();
    return updated ?? null;
  },

  delete: async (id: string) => {
    const [deleted] = await db
      .delete(products)
      .where(and(eq(products.id, id), eq(products.organizationId, organizationId)))
      .returning();
    return deleted ?? null;
  },
});
