import { and, eq, isNull } from 'drizzle-orm';

import { category, categoryProduct } from '../schemas/category';
import type {
  InsertCategoryInputType,
  PatchCategoryInputType,
  InsertCategoryProductInputType,
} from '../schemas/category';
import type { TenantContext } from './types';

export const categoryRepository = ({ db, organizationId }: TenantContext) => ({
  findAll: () => {
    return db.query.category.findMany({
      where: and(eq(category.organizationId, organizationId), isNull(category.deletedAt)),
    });
  },

  findById: (id: string) => {
    return db.query.category.findFirst({
      where: and(
        eq(category.id, id),
        eq(category.organizationId, organizationId),
        isNull(category.deletedAt)
      ),
    });
  },

  findByName: (name: string) => {
    return db.query.category.findFirst({
      where: and(
        eq(category.organizationId, organizationId),
        eq(category.name, name),
        isNull(category.deletedAt)
      ),
    });
  },

  findByCatalog: (catalogId: string) => {
    return db.query.category.findMany({
      where: and(
        eq(category.organizationId, organizationId),
        eq(category.catalogId, catalogId),
        eq(category.isActive, true),
        isNull(category.deletedAt)
      ),
      orderBy: category.servingOrder,
    });
  },

  findByIdWithProducts: (id: string) => {
    return db.query.category.findFirst({
      where: and(
        eq(category.id, id),
        eq(category.organizationId, organizationId),
        isNull(category.deletedAt)
      ),
      with: {
        products: {
          orderBy: (cp: any, { asc }: any) => [asc(cp.displayOrder)],
          with: { product: true },
        },
      },
    });
  },

  /** Full POS expansion: category → products → modifierGroups → modifiers → dependencies */
  findByIdDetailed: (id: string) => {
    return db.query.category.findFirst({
      where: and(
        eq(category.id, id),
        eq(category.organizationId, organizationId),
        isNull(category.deletedAt)
      ),
      with: {
        products: {
          orderBy: (cp: any, { asc }: any) => [asc(cp.displayOrder)],
          with: {
            product: {
              with: {
                modifierGroups: {
                  orderBy: (mg: any, { asc }: any) => [asc(mg.displayOrder)],
                  with: {
                    modifiers: {
                      orderBy: (m: any, { asc }: any) => [asc(m.displayOrder)],
                      with: { dependencies: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  },

  create: async (payload: InsertCategoryInputType) => {
    const [inserted] = await db
      .insert(category)
      .values({ ...payload, organizationId })
      .returning();
    return inserted;
  },

  update: async (id: string, payload: PatchCategoryInputType) => {
    const [updated] = await db
      .update(category)
      .set(payload)
      .where(
        and(
          eq(category.id, id),
          eq(category.organizationId, organizationId),
          isNull(category.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  softDelete: async (id: string) => {
    const [deleted] = await db
      .update(category)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(category.id, id),
          eq(category.organizationId, organizationId),
          isNull(category.deletedAt)
        )
      )
      .returning();
    return deleted ?? null;
  },

  hardDelete: async (id: string) => {
    const [deleted] = await db
      .delete(category)
      .where(and(eq(category.id, id), eq(category.organizationId, organizationId)))
      .returning();
    return deleted ?? null;
  },

  // ── Category <-> Product junction ─────────────────────────────────

  addProduct: async (payload: InsertCategoryProductInputType) => {
    const [inserted] = await db
      .insert(categoryProduct)
      .values({ ...payload, organizationId })
      .onConflictDoNothing()
      .returning();
    return inserted ?? null;
  },

  removeProduct: async (categoryId: string, productId: string) => {
    const [deleted] = await db
      .delete(categoryProduct)
      .where(
        and(
          eq(categoryProduct.categoryId, categoryId),
          eq(categoryProduct.productId, productId),
          eq(categoryProduct.organizationId, organizationId)
        )
      )
      .returning();
    return deleted ?? null;
  },

  updateProductOrder: async (
    categoryId: string,
    productId: string,
    displayOrder: number
  ) => {
    const [updated] = await db
      .update(categoryProduct)
      .set({ displayOrder })
      .where(
        and(
          eq(categoryProduct.categoryId, categoryId),
          eq(categoryProduct.productId, productId),
          eq(categoryProduct.organizationId, organizationId)
        )
      )
      .returning();
    return updated ?? null;
  },
});
