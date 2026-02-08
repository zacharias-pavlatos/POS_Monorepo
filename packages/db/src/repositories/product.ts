import { and, eq, ilike, isNull } from 'drizzle-orm';

import { product } from '../schemas/product';
import type { InsertProductInputType, PatchProductInputType } from '../schemas/product';
import type { TenantContext } from './types';

export const productRepository = ({ db, organizationId }: TenantContext) => ({
  findAll: () => {
    return db.query.product.findMany({
      where: and(eq(product.organizationId, organizationId), isNull(product.deletedAt)),
    });
  },

  findById: (id: string) => {
    return db.query.product.findFirst({
      where: and(
        eq(product.id, id),
        eq(product.organizationId, organizationId),
        isNull(product.deletedAt)
      ),
    });
  },

  findAllActive: () => {
    return db.query.product.findMany({
      where: and(
        eq(product.organizationId, organizationId),
        eq(product.isActive, true),
        isNull(product.deletedAt)
      ),
    });
  },

  searchByName: (query: string) => {
    return db.query.product.findMany({
      where: and(
        eq(product.organizationId, organizationId),
        ilike(product.name, `%${query}%`),
        isNull(product.deletedAt)
      ),
    });
  },

  findByIdWithModifiers: (id: string) => {
    return db.query.product.findFirst({
      where: and(
        eq(product.id, id),
        eq(product.organizationId, organizationId),
        isNull(product.deletedAt)
      ),
      with: {
        modifierGroups: {
          orderBy: (mg: any, { asc }: any) => [asc(mg.displayOrder)],
          with: {
            modifiers: {
              orderBy: (m: any, { asc }: any) => [asc(m.displayOrder)],
            },
          },
        },
      },
    });
  },

  findByIdDetailed: (id: string) => {
    return db.query.product.findFirst({
      where: and(
        eq(product.id, id),
        eq(product.organizationId, organizationId),
        isNull(product.deletedAt)
      ),
      with: {
        workstation: true,
        categories: { with: { category: true } },
        modifierGroups: {
          orderBy: (mg: any, { asc }: any) => [asc(mg.displayOrder)],
          with: {
            modifiers: {
              orderBy: (m: any, { asc }: any) => [asc(m.displayOrder)],
              with: { dependencies: true },
            },
          },
        },
        offers: { with: { offer: true } },
      },
    });
  },

  create: async (payload: InsertProductInputType) => {
    const [inserted] = await db
      .insert(product)
      .values({ ...payload, organizationId })
      .returning();
    return inserted;
  },

  update: async (id: string, payload: PatchProductInputType) => {
    const [updated] = await db
      .update(product)
      .set(payload)
      .where(
        and(
          eq(product.id, id),
          eq(product.organizationId, organizationId),
          isNull(product.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  softDelete: async (id: string) => {
    const [deleted] = await db
      .update(product)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(product.id, id),
          eq(product.organizationId, organizationId),
          isNull(product.deletedAt)
        )
      )
      .returning();
    return deleted ?? null;
  },

  hardDelete: async (id: string) => {
    const [deleted] = await db
      .delete(product)
      .where(and(eq(product.id, id), eq(product.organizationId, organizationId)))
      .returning();
    return deleted ?? null;
  },
});
