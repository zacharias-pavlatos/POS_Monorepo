import { and, eq, isNull, gte, lte, or } from 'drizzle-orm';

import { offer, offerCategory, offerProduct } from '../schemas/offer';
import type {
  InsertOfferInputType,
  PatchOfferInputType,
  InsertOfferCategoryInputType,
  InsertOfferProductInputType,
} from '../schemas/offer';
import type { TenantContext } from './types';

export const offerRepository = ({ db, organizationId }: TenantContext) => ({
  findAll: () => {
    return db.query.offer.findMany({
      where: and(eq(offer.organizationId, organizationId), isNull(offer.deletedAt)),
    });
  },

  findById: (id: string) => {
    return db.query.offer.findFirst({
      where: and(
        eq(offer.id, id),
        eq(offer.organizationId, organizationId),
        isNull(offer.deletedAt)
      ),
    });
  },

  findByName: (name: string) => {
    return db.query.offer.findFirst({
      where: and(
        eq(offer.organizationId, organizationId),
        eq(offer.name, name),
        isNull(offer.deletedAt)
      ),
    });
  },

  /** Get active offers whose validity window covers right now. */
  findCurrentlyActive: () => {
    const now = new Date();
    return db.query.offer.findMany({
      where: and(
        eq(offer.organizationId, organizationId),
        eq(offer.isActive, true),
        lte(offer.validFrom, now),
        or(isNull(offer.validUntil), gte(offer.validUntil, now)),
        isNull(offer.deletedAt)
      ),
      orderBy: offer.priority,
      with: {
        categories: { with: { category: true } },
        products: { with: { product: true } },
      },
    });
  },

  findByIdWithTargets: (id: string) => {
    return db.query.offer.findFirst({
      where: and(
        eq(offer.id, id),
        eq(offer.organizationId, organizationId),
        isNull(offer.deletedAt)
      ),
      with: {
        categories: { with: { category: true } },
        products: { with: { product: true } },
      },
    });
  },

  create: async (payload: InsertOfferInputType) => {
    const [inserted] = await db
      .insert(offer)
      .values({ ...payload, organizationId })
      .returning();
    return inserted;
  },

  update: async (id: string, payload: PatchOfferInputType) => {
    const [updated] = await db
      .update(offer)
      .set(payload)
      .where(
        and(
          eq(offer.id, id),
          eq(offer.organizationId, organizationId),
          isNull(offer.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  softDelete: async (id: string) => {
    const [deleted] = await db
      .update(offer)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(offer.id, id),
          eq(offer.organizationId, organizationId),
          isNull(offer.deletedAt)
        )
      )
      .returning();
    return deleted ?? null;
  },

  hardDelete: async (id: string) => {
    const [deleted] = await db
      .delete(offer)
      .where(and(eq(offer.id, id), eq(offer.organizationId, organizationId)))
      .returning();
    return deleted ?? null;
  },

  // ── Offer <-> Category junction ───────────────────────────────────

  findCategories: (offerId: string) => {
    return db.query.offerCategory.findMany({
      where: and(
        eq(offerCategory.offerId, offerId),
        eq(offerCategory.organizationId, organizationId)
      ),
    });
  },

  addCategory: async (payload: InsertOfferCategoryInputType) => {
    const [inserted] = await db
      .insert(offerCategory)
      .values({ ...payload, organizationId })
      .onConflictDoNothing()
      .returning();
    return inserted ?? null;
  },

  removeCategory: async (offerId: string, categoryId: string) => {
    const [deleted] = await db
      .delete(offerCategory)
      .where(
        and(
          eq(offerCategory.offerId, offerId),
          eq(offerCategory.categoryId, categoryId),
          eq(offerCategory.organizationId, organizationId)
        )
      )
      .returning();
    return deleted ?? null;
  },

  // ── Offer <-> Product junction ────────────────────────────────────

  findProducts: (offerId: string) => {
    return db.query.offerProduct.findMany({
      where: and(
        eq(offerProduct.offerId, offerId),
        eq(offerProduct.organizationId, organizationId)
      ),
    });
  },

  addProduct: async (payload: InsertOfferProductInputType) => {
    const [inserted] = await db
      .insert(offerProduct)
      .values({ ...payload, organizationId })
      .onConflictDoNothing()
      .returning();
    return inserted ?? null;
  },

  removeProduct: async (offerId: string, productId: string) => {
    const [deleted] = await db
      .delete(offerProduct)
      .where(
        and(
          eq(offerProduct.offerId, offerId),
          eq(offerProduct.productId, productId),
          eq(offerProduct.organizationId, organizationId)
        )
      )
      .returning();
    return deleted ?? null;
  },
});
