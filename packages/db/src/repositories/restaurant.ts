import { and, eq, isNull } from 'drizzle-orm';

import { restaurant } from '../schemas/restaurant';
import type {
  InsertRestaurantInputType,
  PatchRestaurantInputType,
} from '../schemas/restaurant';
import type { TenantContext } from './types';

export const restaurantRepository = ({ db, organizationId }: TenantContext) => ({
  find: () => {
    return db.query.restaurant.findFirst({
      where: and(
        eq(restaurant.organizationId, organizationId),
        isNull(restaurant.deletedAt)
      ),
    });
  },

  create: async (payload: InsertRestaurantInputType) => {
    const [inserted] = await db
      .insert(restaurant)
      .values({ ...payload, organizationId })
      .returning();
    return inserted;
  },

  update: async (payload: PatchRestaurantInputType) => {
    const [updated] = await db
      .update(restaurant)
      .set(payload)
      .where(
        and(eq(restaurant.organizationId, organizationId), isNull(restaurant.deletedAt))
      )
      .returning();
    return updated ?? null;
  },

  softDelete: async () => {
    const [deleted] = await db
      .update(restaurant)
      .set({ deletedAt: new Date() })
      .where(
        and(eq(restaurant.organizationId, organizationId), isNull(restaurant.deletedAt))
      )
      .returning();
    return deleted ?? null;
  },
});
