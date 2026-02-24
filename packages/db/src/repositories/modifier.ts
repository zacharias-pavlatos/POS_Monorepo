import { and, eq, isNull } from 'drizzle-orm';

import { modifierGroup, modifier, modifierOptionDependency } from '../schemas/modifier';
import type {
  InsertModifierGroupInputType,
  PatchModifierGroupInputType,
  InsertModifierInputType,
  PatchModifierInputType,
  InsertModifierOptionDependencyInputType,
  PatchModifierOptionDependencyInputType,
} from '../schemas/modifier';
import type { TenantContext } from './types';

// ── Modifier Group ──────────────────────────────────────────────────────

export const modifierGroupRepository = ({ db, organizationId }: TenantContext) => ({
  findAll: () => {
    return db.query.modifierGroup.findMany({
      where: and(
        eq(modifierGroup.organizationId, organizationId),
        isNull(modifierGroup.deletedAt)
      ),
    });
  },

  findById: (id: string) => {
    return db.query.modifierGroup.findFirst({
      where: and(
        eq(modifierGroup.id, id),
        eq(modifierGroup.organizationId, organizationId),
        isNull(modifierGroup.deletedAt)
      ),
    });
  },

  findByProduct: (productId: string) => {
    return db.query.modifierGroup.findMany({
      where: and(
        eq(modifierGroup.organizationId, organizationId),
        eq(modifierGroup.productId, productId),
        isNull(modifierGroup.deletedAt)
      ),
      orderBy: modifierGroup.displayOrder,
    });
  },

  findByIdWithModifiers: (id: string) => {
    return db.query.modifierGroup.findFirst({
      where: and(
        eq(modifierGroup.id, id),
        eq(modifierGroup.organizationId, organizationId),
        isNull(modifierGroup.deletedAt)
      ),
      with: {
        modifiers: {
          orderBy: (m: any, { asc }: any) => [asc(m.displayOrder)],
          with: { dependencies: true },
        },
      },
    });
  },

  create: async (payload: InsertModifierGroupInputType) => {
    const [inserted] = await db
      .insert(modifierGroup)
      .values({ ...payload, organizationId })
      .returning();
    return inserted;
  },

  update: async (id: string, payload: PatchModifierGroupInputType) => {
    const [updated] = await db
      .update(modifierGroup)
      .set(payload)
      .where(
        and(
          eq(modifierGroup.id, id),
          eq(modifierGroup.organizationId, organizationId),
          isNull(modifierGroup.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  softDelete: async (id: string) => {
    const [deleted] = await db
      .update(modifierGroup)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(modifierGroup.id, id),
          eq(modifierGroup.organizationId, organizationId),
          isNull(modifierGroup.deletedAt)
        )
      )
      .returning();
    return deleted ?? null;
  },

  hardDelete: async (id: string) => {
    const [deleted] = await db
      .delete(modifierGroup)
      .where(
        and(eq(modifierGroup.id, id), eq(modifierGroup.organizationId, organizationId))
      )
      .returning();
    return deleted ?? null;
  },
});

// ── Modifier (individual option) ────────────────────────────────────────

export const modifierRepository = ({ db, organizationId }: TenantContext) => ({
  findAll: () => {
    return db.query.modifier.findMany({
      where: and(eq(modifier.organizationId, organizationId), isNull(modifier.deletedAt)),
    });
  },

  findById: (id: string) => {
    return db.query.modifier.findFirst({
      where: and(
        eq(modifier.id, id),
        eq(modifier.organizationId, organizationId),
        isNull(modifier.deletedAt)
      ),
    });
  },

  findByGroup: (modifierGroupId: string) => {
    return db.query.modifier.findMany({
      where: and(
        eq(modifier.organizationId, organizationId),
        eq(modifier.modifierGroupId, modifierGroupId),
        isNull(modifier.deletedAt)
      ),
      orderBy: modifier.displayOrder,
    });
  },

  findActiveByGroup: (modifierGroupId: string) => {
    return db.query.modifier.findMany({
      where: and(
        eq(modifier.organizationId, organizationId),
        eq(modifier.modifierGroupId, modifierGroupId),
        eq(modifier.isActive, true),
        isNull(modifier.deletedAt)
      ),
      orderBy: modifier.displayOrder,
    });
  },

  // Fetch modifiers with referenced product data
  findByGroupWithProducts: (modifierGroupId: string) => {
    return db.query.modifier.findMany({
      where: and(
        eq(modifier.organizationId, organizationId),
        eq(modifier.modifierGroupId, modifierGroupId),
        isNull(modifier.deletedAt)
      ),
      with: {
        referencedProduct: true, // ← Include referenced product
      },
      orderBy: modifier.displayOrder,
    });
  },

  findByIdWithDependencies: (id: string) => {
    return db.query.modifier.findFirst({
      where: and(
        eq(modifier.id, id),
        eq(modifier.organizationId, organizationId),
        isNull(modifier.deletedAt)
      ),
      with: {
        referencedProduct: true,
        dependencies: true,
        dependents: true,
      },
    });
  },

  create: async (payload: InsertModifierInputType) => {
    const [inserted] = await db
      .insert(modifier)
      .values({ ...payload, organizationId })
      .returning();
    return inserted;
  },

  update: async (id: string, payload: PatchModifierInputType) => {
    const [updated] = await db
      .update(modifier)
      .set(payload)
      .where(
        and(
          eq(modifier.id, id),
          eq(modifier.organizationId, organizationId),
          isNull(modifier.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  softDelete: async (id: string) => {
    const [deleted] = await db
      .update(modifier)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(modifier.id, id),
          eq(modifier.organizationId, organizationId),
          isNull(modifier.deletedAt)
        )
      )
      .returning();
    return deleted ?? null;
  },

  hardDelete: async (id: string) => {
    const [deleted] = await db
      .delete(modifier)
      .where(and(eq(modifier.id, id), eq(modifier.organizationId, organizationId)))
      .returning();
    return deleted ?? null;
  },
});

// ── Modifier Option Dependency ──────────────────────────────────────────

export const modifierOptionDependencyRepository = ({
  db,
  organizationId,
}: TenantContext) => ({
  findById: (id: string) => {
    return db.query.modifierOptionDependency.findFirst({
      where: and(
        eq(modifierOptionDependency.id, id),
        eq(modifierOptionDependency.organizationId, organizationId),
        isNull(modifierOptionDependency.deletedAt)
      ),
    });
  },

  findByModifier: (modifierId: string) => {
    return db.query.modifierOptionDependency.findMany({
      where: and(
        eq(modifierOptionDependency.organizationId, organizationId),
        eq(modifierOptionDependency.modifierId, modifierId),
        isNull(modifierOptionDependency.deletedAt)
      ),
    });
  },

  findByTrigger: (dependsOnModifierId: string) => {
    return db.query.modifierOptionDependency.findMany({
      where: and(
        eq(modifierOptionDependency.organizationId, organizationId),
        eq(modifierOptionDependency.dependsOnModifierId, dependsOnModifierId),
        isNull(modifierOptionDependency.deletedAt)
      ),
    });
  },

  /**
   * Resolve: given a modifier and the currently selected modifiers,
   * find the matching dependency row (for price/isAvailable override).
   * Returns null if no dependency matches (use modifier defaults).
   */
  resolve: async (modifierId: string, selectedModifierIds: string[]) => {
    if (selectedModifierIds.length === 0) return null;

    const deps = await db.query.modifierOptionDependency.findMany({
      where: and(
        eq(modifierOptionDependency.organizationId, organizationId),
        eq(modifierOptionDependency.modifierId, modifierId),
        isNull(modifierOptionDependency.deletedAt)
      ),
    });

    return deps.find(d => selectedModifierIds.includes(d.dependsOnModifierId)) ?? null;
  },

  create: async (payload: InsertModifierOptionDependencyInputType) => {
    const [inserted] = await db
      .insert(modifierOptionDependency)
      .values({ ...payload, organizationId })
      .returning();
    return inserted;
  },

  update: async (id: string, payload: PatchModifierOptionDependencyInputType) => {
    const [updated] = await db
      .update(modifierOptionDependency)
      .set(payload)
      .where(
        and(
          eq(modifierOptionDependency.id, id),
          eq(modifierOptionDependency.organizationId, organizationId),
          isNull(modifierOptionDependency.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  softDelete: async (id: string) => {
    const [deleted] = await db
      .update(modifierOptionDependency)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(modifierOptionDependency.id, id),
          eq(modifierOptionDependency.organizationId, organizationId),
          isNull(modifierOptionDependency.deletedAt)
        )
      )
      .returning();
    return deleted ?? null;
  },

  hardDelete: async (id: string) => {
    const [deleted] = await db
      .delete(modifierOptionDependency)
      .where(
        and(
          eq(modifierOptionDependency.id, id),
          eq(modifierOptionDependency.organizationId, organizationId)
        )
      )
      .returning();
    return deleted ?? null;
  },
});
