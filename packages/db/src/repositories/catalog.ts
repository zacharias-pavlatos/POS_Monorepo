import { and, eq, isNull } from 'drizzle-orm';

import { catalog } from '../schemas/catalog';
import type { InsertCatalogInputType, PatchCatalogInputType } from '../schemas/catalog';
import type { TenantContext } from './types';

export const catalogRepository = ({ db, organizationId }: TenantContext) => ({
  findAll: () => {
    return db.query.catalog.findMany({
      where: and(eq(catalog.organizationId, organizationId), isNull(catalog.deletedAt)),
    });
  },

  findById: (id: string) => {
    return db.query.catalog.findFirst({
      where: and(
        eq(catalog.id, id),
        eq(catalog.organizationId, organizationId),
        isNull(catalog.deletedAt)
      ),
    });
  },

  findByName: (name: string) => {
    return db.query.catalog.findFirst({
      where: and(
        eq(catalog.organizationId, organizationId),
        eq(catalog.name, name),
        isNull(catalog.deletedAt)
      ),
    });
  },

  findAllActive: () => {
    return db.query.catalog.findMany({
      where: and(
        eq(catalog.organizationId, organizationId),
        eq(catalog.isActive, true),
        isNull(catalog.deletedAt)
      ),
      orderBy: catalog.displayOrder,
    });
  },

  findByIdWithCategories: (id: string) => {
    return db.query.catalog.findFirst({
      where: and(
        eq(catalog.id, id),
        eq(catalog.organizationId, organizationId),
        isNull(catalog.deletedAt)
      ),
      with: {
        categories: {
          orderBy: (cat: any, { asc }: any) => [asc(cat.servingOrder)],
        },
      },
    });
  },

  create: async (payload: InsertCatalogInputType) => {
    const [inserted] = await db
      .insert(catalog)
      .values({ ...payload, organizationId })
      .returning();
    return inserted;
  },

  update: async (id: string, payload: PatchCatalogInputType) => {
    const [updated] = await db
      .update(catalog)
      .set(payload)
      .where(
        and(
          eq(catalog.id, id),
          eq(catalog.organizationId, organizationId),
          isNull(catalog.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  softDelete: async (id: string) => {
    const [deleted] = await db
      .update(catalog)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(catalog.id, id),
          eq(catalog.organizationId, organizationId),
          isNull(catalog.deletedAt)
        )
      )
      .returning();
    return deleted ?? null;
  },

  hardDelete: async (id: string) => {
    const [deleted] = await db
      .delete(catalog)
      .where(and(eq(catalog.id, id), eq(catalog.organizationId, organizationId)))
      .returning();
    return deleted ?? null;
  },
});
