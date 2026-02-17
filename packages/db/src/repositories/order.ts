import { and, eq, isNull, inArray, sql, gte, lte, ne } from 'drizzle-orm';

import { order, orderItem, orderItemModifier } from '../schemas/order';
import type {
  InsertOrderInputType,
  PatchOrderInputType,
  InsertOrderItemInputType,
  InsertOrderItemModifierInputType,
} from '../schemas/order';
import type { TenantContext } from './types';

// ── Order ───────────────────────────────────────────────────────────────

export const orderRepository = ({ db, organizationId }: TenantContext) => ({
  // ── Basic ─────────────────────────────────────────────────────────

  findAll: () => {
    return db.query.order.findMany({
      where: and(eq(order.organizationId, organizationId), isNull(order.deletedAt)),
    });
  },

  findById: (id: string) => {
    return db.query.order.findFirst({
      where: and(
        eq(order.id, id),
        eq(order.organizationId, organizationId),
        isNull(order.deletedAt)
      ),
    });
  },

  findAllOpen: () => {
    return db.query.order.findMany({
      where: and(
        eq(order.organizationId, organizationId),
        eq(order.status, 'open'),
        isNull(order.deletedAt)
      ),
      orderBy: order.openedAt,
    });
  },

  findBySession: (tableSessionId: string) => {
    return db.query.order.findMany({
      where: and(
        eq(order.organizationId, organizationId),
        eq(order.tableSessionId, tableSessionId),
        isNull(order.deletedAt)
      ),
    });
  },

  findOpenBySession: (tableSessionId: string) => {
    return db.query.order.findFirst({
      where: and(
        eq(order.organizationId, organizationId),
        eq(order.tableSessionId, tableSessionId),
        eq(order.status, 'open'),
        isNull(order.deletedAt)
      ),
    });
  },

  findByWaiter: (openedById: string) => {
    return db.query.order.findMany({
      where: and(
        eq(order.organizationId, organizationId),
        eq(order.openedById, openedById),
        isNull(order.deletedAt)
      ),
      orderBy: order.openedAt,
    });
  },

  findOpenByWaiter: (openedById: string) => {
    return db.query.order.findMany({
      where: and(
        eq(order.organizationId, organizationId),
        eq(order.openedById, openedById),
        eq(order.status, 'open'),
        isNull(order.deletedAt)
      ),
      orderBy: order.openedAt,
    });
  },

  // ── Aggregated ────────────────────────────────────────────────────

  /** Order with items and modifiers (waiter view) */
  findByIdWithItems: (id: string) => {
    return db.query.order.findFirst({
      where: and(
        eq(order.id, id),
        eq(order.organizationId, organizationId),
        isNull(order.deletedAt)
      ),
      with: {
        items: {
          with: { modifiers: true },
          orderBy: (i: any, { asc }: any) => [asc(i.createdAt)],
        },
        openedBy: true,
      },
    });
  },

  /** Order with items + discounts (discount management view) */
  findByIdWithDiscounts: (id: string) => {
    return db.query.order.findFirst({
      where: and(
        eq(order.id, id),
        eq(order.organizationId, organizationId),
        isNull(order.deletedAt)
      ),
      with: {
        items: {
          with: {
            modifiers: true,
            discounts: true,
          },
        },
        discounts: {
          with: {
            offer: true,
            appliedBy: true,
            approvedBy: true,
          },
        },
      },
    });
  },

  /** Order ready for billing: items + modifiers (for check creation) */
  findByIdForBilling: (id: string) => {
    return db.query.order.findFirst({
      where: and(
        eq(order.id, id),
        eq(order.organizationId, organizationId),
        isNull(order.deletedAt)
      ),
      with: {
        items: {
          where: (i: any, { ne: notEq }: any) => notEq(i.status, 'voided'),
          with: { modifiers: true },
        },
        discounts: true,
      },
    });
  },

  /** Full order detail: items + modifiers + discounts + checks + payments */
  findByIdDetailed: (id: string) => {
    return db.query.order.findFirst({
      where: and(
        eq(order.id, id),
        eq(order.organizationId, organizationId),
        isNull(order.deletedAt)
      ),
      with: {
        tableSession: {
          with: {
            tables: {
              where: (st: any, { isNull: nil }: any) =>
                and(nil(st.leftAt), nil(st.deletedAt)),
              with: { table: true },
            },
          },
        },
        openedBy: true,
        items: {
          with: {
            modifiers: true,
            discounts: true,
            addedBy: true,
          },
          orderBy: (i: any, { asc }: any) => [asc(i.createdAt)],
        },
        discounts: {
          with: {
            offer: true,
            appliedBy: true,
            approvedBy: true,
          },
        },
        checks: {
          with: {
            items: {
              with: { orderItem: true },
            },
            discounts: true,
            payments: true,
          },
        },
      },
    });
  },

  /** All open orders with items (dashboard / KDS overview) */
  findAllOpenWithItems: () => {
    return db.query.order.findMany({
      where: and(
        eq(order.organizationId, organizationId),
        eq(order.status, 'open'),
        isNull(order.deletedAt)
      ),
      orderBy: order.openedAt,
      with: {
        tableSession: {
          with: {
            tables: {
              where: (st: any, { isNull: nil }: any) =>
                and(nil(st.leftAt), nil(st.deletedAt)),
              with: { table: true },
            },
          },
        },
        items: {
          with: { modifiers: true },
        },
      },
    });
  },

  /** Orders within a date range (reporting) */
  findByDateRange: (from: Date, to: Date) => {
    return db.query.order.findMany({
      where: and(
        eq(order.organizationId, organizationId),
        gte(order.openedAt, from),
        lte(order.openedAt, to),
        isNull(order.deletedAt)
      ),
      orderBy: order.openedAt,
    });
  },

  /** Daily order summary (reporting dashboard) */
  dailySummary: async (from: Date, to: Date) => {
    return db
      .select({
        count: sql<number>`count(*)`.as('count'),
        totalRevenue: sql<number>`coalesce(sum(${order.total}), 0)`.as(
          'total_revenue'
        ),
        totalDiscount: sql<number>`coalesce(sum(${order.discountTotal}), 0)`.as(
          'total_discount'
        ),
        totalTax: sql<number>`coalesce(sum(${order.taxTotal}), 0)`.as('total_tax'),
        avgOrderValue: sql<number>`coalesce(avg(${order.total}), 0)`.as(
          'avg_order_value'
        ),
        totalGuests: sql<number>`coalesce(sum(${order.guestCount}), 0)`.as(
          'total_guests'
        ),
      })
      .from(order)
      .where(
        and(
          eq(order.organizationId, organizationId),
          ne(order.status, 'voided'),
          gte(order.openedAt, from),
          lte(order.openedAt, to),
          isNull(order.deletedAt)
        )
      );
  },

  // ── Mutations ─────────────────────────────────────────────────────

  create: async (payload: InsertOrderInputType) => {
    const [inserted] = await db
      .insert(order)
      .values({ ...payload, organizationId })
      .returning();
    return inserted;
  },

  update: async (id: string, payload: PatchOrderInputType) => {
    const [updated] = await db
      .update(order)
      .set(payload)
      .where(
        and(
          eq(order.id, id),
          eq(order.organizationId, organizationId),
          isNull(order.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  /** Update cached totals (called after every item/discount mutation) */
  updateTotals: async (
    id: string,
    totals: {
      subtotal: number;
      discountTotal: number;
      taxTotal: number;
      total: number;
    }
  ) => {
    const [updated] = await db
      .update(order)
      .set(totals)
      .where(
        and(
          eq(order.id, id),
          eq(order.organizationId, organizationId),
          isNull(order.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  /**
   * Fire all unfired items as a new round.
   * Returns the fired items + updated order, or null if nothing to fire.
   *
   * NOTE: Wrap this in db.transaction() at the service layer along
   * with total recalculation and any print job creation.
   */
  fireRound: async (id: string) => {
    const current = await db.query.order.findFirst({
      where: and(
        eq(order.id, id),
        eq(order.organizationId, organizationId),
        eq(order.status, 'open'),
        isNull(order.deletedAt)
      ),
    });
    if (!current) return null;

    const now = new Date();

    const firedItems = await db
      .update(orderItem)
      .set({
        status: 'sent',
        round: current.currentRound,
        firedAt: now,
      })
      .where(
        and(
          eq(orderItem.orderId, id),
          eq(orderItem.organizationId, organizationId),
          eq(orderItem.status, 'new'),
          isNull(orderItem.round)
        )
      )
      .returning();

    if (firedItems.length === 0) return null;

    const [updated] = await db
      .update(order)
      .set({ currentRound: current.currentRound + 1 })
      .where(eq(order.id, id))
      .returning();

    return { order: updated, firedItems };
  },

  /**
   * Fire specific items (selective firing).
   * Used when waiter picks which items to send vs hold back.
   */
  fireSelectedItems: async (id: string, itemIds: string[]) => {
    if (itemIds.length === 0) return null;

    const current = await db.query.order.findFirst({
      where: and(
        eq(order.id, id),
        eq(order.organizationId, organizationId),
        eq(order.status, 'open'),
        isNull(order.deletedAt)
      ),
    });
    if (!current) return null;

    const now = new Date();

    const firedItems = await db
      .update(orderItem)
      .set({
        status: 'sent',
        round: current.currentRound,
        firedAt: now,
      })
      .where(
        and(
          eq(orderItem.orderId, id),
          eq(orderItem.organizationId, organizationId),
          eq(orderItem.status, 'new'),
          isNull(orderItem.round),
          inArray(orderItem.id, itemIds)
        )
      )
      .returning();

    if (firedItems.length === 0) return null;

    const [updated] = await db
      .update(order)
      .set({ currentRound: current.currentRound + 1 })
      .where(eq(order.id, id))
      .returning();

    return { order: updated, firedItems };
  },

  /** Close order (after all checks paid) */
  close: async (id: string) => {
    const [updated] = await db
      .update(order)
      .set({
        status: 'closed',
        closedAt: new Date(),
      })
      .where(
        and(
          eq(order.id, id),
          eq(order.organizationId, organizationId),
          eq(order.status, 'open'),
          isNull(order.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  /** Void entire order */
  void: async (id: string) => {
    const [updated] = await db
      .update(order)
      .set({
        status: 'voided',
        closedAt: new Date(),
      })
      .where(
        and(
          eq(order.id, id),
          eq(order.organizationId, organizationId),
          eq(order.status, 'open'),
          isNull(order.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  softDelete: async (id: string) => {
    const [deleted] = await db
      .update(order)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(order.id, id),
          eq(order.organizationId, organizationId),
          isNull(order.deletedAt)
        )
      )
      .returning();
    return deleted ?? null;
  },
});

// ── Order Item ──────────────────────────────────────────────────────────

export const orderItemRepository = ({ db, organizationId }: TenantContext) => ({
  // ── Basic ─────────────────────────────────────────────────────────

  findById: (id: string) => {
    return db.query.orderItem.findFirst({
      where: and(
        eq(orderItem.id, id),
        eq(orderItem.organizationId, organizationId),
        isNull(orderItem.deletedAt)
      ),
    });
  },

  findByOrder: (orderId: string) => {
    return db.query.orderItem.findMany({
      where: and(
        eq(orderItem.organizationId, organizationId),
        eq(orderItem.orderId, orderId),
        isNull(orderItem.deletedAt)
      ),
      with: { modifiers: true },
      orderBy: (i: any, { asc }: any) => [asc(i.createdAt)],
    });
  },

  /** Non-voided items only (for totals calculation) */
  findActiveByOrder: (orderId: string) => {
    return db.query.orderItem.findMany({
      where: and(
        eq(orderItem.organizationId, organizationId),
        eq(orderItem.orderId, orderId),
        ne(orderItem.status, 'voided'),
        isNull(orderItem.deletedAt)
      ),
    });
  },

  /** Unfired items (status = new, round = null) */
  findUnfired: (orderId: string) => {
    return db.query.orderItem.findMany({
      where: and(
        eq(orderItem.organizationId, organizationId),
        eq(orderItem.orderId, orderId),
        eq(orderItem.status, 'new'),
        isNull(orderItem.round),
        isNull(orderItem.deletedAt)
      ),
      with: { modifiers: true },
    });
  },

  /** Items by round (for ticket grouping) */
  findByRound: (orderId: string, round: number) => {
    return db.query.orderItem.findMany({
      where: and(
        eq(orderItem.organizationId, organizationId),
        eq(orderItem.orderId, orderId),
        eq(orderItem.round, round),
        isNull(orderItem.deletedAt)
      ),
      with: { modifiers: true },
    });
  },

  /** Items by seat (for split-by-seat billing) */
  findBySeat: (orderId: string, seatNumber: number) => {
    return db.query.orderItem.findMany({
      where: and(
        eq(orderItem.organizationId, organizationId),
        eq(orderItem.orderId, orderId),
        eq(orderItem.seatNumber, seatNumber),
        ne(orderItem.status, 'voided'),
        isNull(orderItem.deletedAt)
      ),
      with: { modifiers: true },
    });
  },

  // ── Aggregated ────────────────────────────────────────────────────

  /** Item with modifiers and discounts */
  findByIdDetailed: (id: string) => {
    return db.query.orderItem.findFirst({
      where: and(
        eq(orderItem.id, id),
        eq(orderItem.organizationId, organizationId),
        isNull(orderItem.deletedAt)
      ),
      with: {
        modifiers: true,
        discounts: {
          with: {
            offer: true,
            appliedBy: true,
          },
        },
        product: true,
        addedBy: true,
      },
    });
  },

  /**
   * KDS query: items needing attention.
   * Groups by order → round for ticket display.
   * Filter by workstation in the service layer using product.workstationId
   * or product.categories[0].workstationId.
   */
  findForKDS: (statuses: ('sent' | 'preparing')[]) => {
    return db.query.orderItem.findMany({
      where: and(
        eq(orderItem.organizationId, organizationId),
        inArray(orderItem.status, statuses),
        isNull(orderItem.deletedAt)
      ),
      with: {
        modifiers: true,
        order: {
          with: {
            tableSession: {
              with: {
                tables: {
                  where: (st: any, { isNull: nil }: any) =>
                    and(nil(st.leftAt), nil(st.deletedAt)),
                  with: { table: true },
                },
              },
            },
          },
        },
        product: {
          with: { workstation: true },
        },
      },
      orderBy: (i: any, { asc }: any) => [asc(i.firedAt)],
    });
  },

  /** Ready items waiting for pickup (expo view) */
  findReady: () => {
    return db.query.orderItem.findMany({
      where: and(
        eq(orderItem.organizationId, organizationId),
        eq(orderItem.status, 'ready'),
        isNull(orderItem.deletedAt)
      ),
      with: {
        modifiers: true,
        order: {
          with: {
            tableSession: {
              with: {
                tables: {
                  where: (st: any, { isNull: nil }: any) =>
                    and(nil(st.leftAt), nil(st.deletedAt)),
                  with: { table: true },
                },
              },
            },
          },
        },
      },
      orderBy: (i: any, { asc }: any) => [asc(i.firedAt)],
    });
  },

  /** Voided items (for manager review) */
  findVoided: (orderId: string) => {
    return db.query.orderItem.findMany({
      where: and(
        eq(orderItem.organizationId, organizationId),
        eq(orderItem.orderId, orderId),
        eq(orderItem.status, 'voided'),
        isNull(orderItem.deletedAt)
      ),
      with: { modifiers: true },
    });
  },

  /** Top sold products in a date range (analytics) */
  topProducts: async (from: Date, to: Date, limit = 10) => {
    return db
      .select({
        productId: orderItem.productId,
        productName: orderItem.productName,
        totalQuantity: sql<number>`sum(${orderItem.quantity})`.as('total_quantity'),
        totalRevenue: sql<number>`sum(${orderItem.itemTotal})`.as('total_revenue'),
      })
      .from(orderItem)
      .innerJoin(order, eq(orderItem.orderId, order.id))
      .where(
        and(
          eq(orderItem.organizationId, organizationId),
          ne(orderItem.status, 'voided'),
          gte(order.openedAt, from),
          lte(order.openedAt, to),
          isNull(orderItem.deletedAt),
          isNull(order.deletedAt)
        )
      )
      .groupBy(orderItem.productId, orderItem.productName)
      .orderBy(sql`total_quantity desc`)
      .limit(limit);
  },

  // ── Mutations ─────────────────────────────────────────────────────

  create: async (payload: InsertOrderItemInputType) => {
    const [inserted] = await db
      .insert(orderItem)
      .values({ ...payload, organizationId })
      .returning();
    return inserted;
  },

  /** Batch create items (waiter adds multiple items at once) */
  createMany: async (payloads: InsertOrderItemInputType[]) => {
    return db
      .insert(orderItem)
      .values(payloads.map(p => ({ ...p, organizationId })))
      .returning();
  },

  /** Update item status (KDS workflow) */
  updateStatus: async (id: string, status: 'preparing' | 'ready' | 'served') => {
    const [updated] = await db
      .update(orderItem)
      .set({ status })
      .where(
        and(
          eq(orderItem.id, id),
          eq(orderItem.organizationId, organizationId),
          isNull(orderItem.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  /** Batch update status (e.g. mark entire round as preparing) */
  updateStatusBatch: async (
    ids: string[],
    status: 'preparing' | 'ready' | 'served'
  ) => {
    return db
      .update(orderItem)
      .set({ status })
      .where(
        and(
          eq(orderItem.organizationId, organizationId),
          inArray(orderItem.id, ids),
          isNull(orderItem.deletedAt)
        )
      )
      .returning();
  },

  /** Void an item with accountability */
  void: async (id: string, voidedById: string, voidReason: string) => {
    const [updated] = await db
      .update(orderItem)
      .set({
        status: 'voided',
        voidedAt: new Date(),
        voidedById,
        voidReason,
      })
      .where(
        and(
          eq(orderItem.id, id),
          eq(orderItem.organizationId, organizationId),
          isNull(orderItem.voidedAt),
          isNull(orderItem.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  /** Update notes or seat number */
  update: async (
    id: string,
    payload: { notes?: string; seatNumber?: number | null }
  ) => {
    const [updated] = await db
      .update(orderItem)
      .set(payload)
      .where(
        and(
          eq(orderItem.id, id),
          eq(orderItem.organizationId, organizationId),
          isNull(orderItem.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },
});

// ── Order Item Modifier ─────────────────────────────────────────────────

export const orderItemModifierRepository = ({
  db,
  organizationId,
}: TenantContext) => ({
  findByOrderItem: (orderItemId: string) => {
    return db.query.orderItemModifier.findMany({
      where: and(
        eq(orderItemModifier.organizationId, organizationId),
        eq(orderItemModifier.orderItemId, orderItemId),
        isNull(orderItemModifier.deletedAt)
      ),
    });
  },

  /** All modifiers for all items in an order (for total recalculation) */
  findByOrder: async (orderId: string) => {
    return db.query.orderItemModifier.findMany({
      where: and(
        eq(orderItemModifier.organizationId, organizationId),
        isNull(orderItemModifier.deletedAt)
      ),
      with: {
        orderItem: {
          columns: { orderId: true },
        },
      },
    });
  },

  create: async (payload: InsertOrderItemModifierInputType) => {
    const [inserted] = await db
      .insert(orderItemModifier)
      .values({ ...payload, organizationId })
      .returning();
    return inserted;
  },

  createMany: async (payloads: InsertOrderItemModifierInputType[]) => {
    return db
      .insert(orderItemModifier)
      .values(payloads.map(p => ({ ...p, organizationId })))
      .returning();
  },

  /** Remove a modifier from an item (before firing only) */
  hardDelete: async (id: string) => {
    const [deleted] = await db
      .delete(orderItemModifier)
      .where(
        and(
          eq(orderItemModifier.id, id),
          eq(orderItemModifier.organizationId, organizationId)
        )
      )
      .returning();
    return deleted ?? null;
  },
});
