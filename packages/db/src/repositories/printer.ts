import { and, eq, isNull, isNotNull } from 'drizzle-orm';

import { printer } from '../schemas/printer';
import type {
  InsertPrinterInputType,
  PatchPrinterInputType,
} from '../schemas/printer';
import type { TenantContext } from './types';

export const printerRepository = ({ db, organizationId }: TenantContext) => ({
  // ── Basic ───────────────────────────────────────────────────────────

  findAll: () => {
    return db.query.printer.findMany({
      where: and(
        eq(printer.organizationId, organizationId),
        isNull(printer.deletedAt)
      ),
    });
  },

  findById: (id: string) => {
    return db.query.printer.findFirst({
      where: and(
        eq(printer.id, id),
        eq(printer.organizationId, organizationId),
        isNull(printer.deletedAt)
      ),
    });
  },

  findByName: (name: string) => {
    return db.query.printer.findFirst({
      where: and(
        eq(printer.organizationId, organizationId),
        eq(printer.name, name),
        isNull(printer.deletedAt)
      ),
    });
  },

  findAllActive: () => {
    return db.query.printer.findMany({
      where: and(
        eq(printer.organizationId, organizationId),
        eq(printer.isActive, true),
        isNull(printer.deletedAt)
      ),
    });
  },

  // ── By role (derived from workstationId) ────────────────────────────

  /** Kitchen printers (workstationId is set) */
  findKitchenPrinters: () => {
    return db.query.printer.findMany({
      where: and(
        eq(printer.organizationId, organizationId),
        isNotNull(printer.workstationId),
        eq(printer.isActive, true),
        isNull(printer.deletedAt)
      ),
      with: { workstation: true },
    });
  },

  /** Receipt printers (workstationId is null) */
  findReceiptPrinters: () => {
    return db.query.printer.findMany({
      where: and(
        eq(printer.organizationId, organizationId),
        isNull(printer.workstationId),
        eq(printer.isActive, true),
        isNull(printer.deletedAt)
      ),
    });
  },

  /**
   * Find printer for a specific workstation (ticket routing).
   * Used when firing items: item → category → workstation → printer.
   */
  findByWorkstation: (workstationId: string) => {
    return db.query.printer.findFirst({
      where: and(
        eq(printer.organizationId, organizationId),
        eq(printer.workstationId, workstationId),
        eq(printer.isActive, true),
        isNull(printer.deletedAt)
      ),
    });
  },

  /** All printers for a workstation (includes backups) */
  findAllByWorkstation: (workstationId: string) => {
    return db.query.printer.findMany({
      where: and(
        eq(printer.organizationId, organizationId),
        eq(printer.workstationId, workstationId),
        isNull(printer.deletedAt)
      ),
    });
  },

  // ── Aggregated ──────────────────────────────────────────────────────

  /** Printer with workstation detail */
  findByIdWithWorkstation: (id: string) => {
    return db.query.printer.findFirst({
      where: and(
        eq(printer.id, id),
        eq(printer.organizationId, organizationId),
        isNull(printer.deletedAt)
      ),
      with: { workstation: true },
    });
  },

  /** All printers with their workstation (admin management view) */
  findAllWithWorkstation: () => {
    return db.query.printer.findMany({
      where: and(
        eq(printer.organizationId, organizationId),
        isNull(printer.deletedAt)
      ),
      with: { workstation: true },
    });
  },

  // ── Mutations ───────────────────────────────────────────────────────

  create: async (payload: InsertPrinterInputType) => {
    const [inserted] = await db
      .insert(printer)
      .values({ ...payload, organizationId })
      .returning();
    return inserted;
  },

  update: async (id: string, payload: PatchPrinterInputType) => {
    const [updated] = await db
      .update(printer)
      .set(payload)
      .where(
        and(
          eq(printer.id, id),
          eq(printer.organizationId, organizationId),
          isNull(printer.deletedAt)
        )
      )
      .returning();
    return updated ?? null;
  },

  softDelete: async (id: string) => {
    const [deleted] = await db
      .update(printer)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(printer.id, id),
          eq(printer.organizationId, organizationId),
          isNull(printer.deletedAt)
        )
      )
      .returning();
    return deleted ?? null;
  },

  hardDelete: async (id: string) => {
    const [deleted] = await db
      .delete(printer)
      .where(
        and(eq(printer.id, id), eq(printer.organizationId, organizationId))
      )
      .returning();
    return deleted ?? null;
  },
});
