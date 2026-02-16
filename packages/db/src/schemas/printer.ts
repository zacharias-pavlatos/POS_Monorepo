/**
 * Printer schema - Kitchen ticket printers and receipt printers
 *
 * Two roles, determined by workstationId:
 * - Kitchen printers (workstationId set): tied to a workstation, print
 *   order tickets when items are fired and cancellation slips when voided.
 * - Receipt printers (workstationId null): standalone, used by POS
 *   terminals to print customer receipts at payment time.
 *
 * Connection details live in the DB so managers can add, swap, or
 * reassign printers from the admin panel without a redeploy.
 *
 * Routing:
 *   Waiter fires Round 2 → Burger routes to Kitchen workstation
 *                         → system looks up printer for Kitchen workstation
 *                         → sends ESC/POS data to that printer's IP:port
 *
 *   Payment processed     → system looks up receipt printer for the terminal
 *                         → prints customer receipt
 */

import {
  pgTable,
  text,
  uuid,
  varchar,
  integer,
  boolean,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

import { organization } from './auth-schema';
import { timestamps } from './helpers';
import { workStation } from './workstation';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * How the printer connects to the system.
 * - network: TCP/IP connection (most common for kitchen printers)
 * - usb: direct USB connection to a specific terminal
 * - bluetooth: wireless pairing to a specific terminal
 */
export const printerConnectionTypeEnum = pgEnum('printer_connection_type', [
  'network',
  'usb',
  'bluetooth',
]);

// ============================================================================
// TABLES
// ============================================================================

/**
 * Printers available in the restaurant.
 *
 * Examples:
 *
 * Kitchen printer:
 *   name: "Kitchen Printer"
 *   type: "kitchen"
 *   connectionType: "network"
 *   ipAddress: "192.168.1.100", port: 9100
 *   model: "Epson TM-T88VI"
 *   workstationId: workstation_kitchen
 *
 * Bar printer:
 *   name: "Bar Printer"
 *   type: "kitchen"
 *   connectionType: "network"
 *   ipAddress: "192.168.1.101", port: 9100
 *   model: "Star TSP143IV"
 *   workstationId: workstation_bar
 *
 * Receipt printer:
 *   name: "Front Counter Receipt"
 *   type: "receipt"
 *   connectionType: "usb"
 *   ipAddress: null, port: null
 *   model: "Epson TM-T20III"
 *   workstationId: null
 */
export const printer = pgTable(
  'printer',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 255 }).notNull(),

    connectionType: printerConnectionTypeEnum('connection_type').notNull(),

    // ── CONNECTION DETAILS ─────────────────────────────────────────────

    /** IP address for network printers (null for USB/Bluetooth) */
    ipAddress: varchar('ip_address', { length: 45 }),

    /** Port for network printers (default 9100 for ESC/POS) */
    port: integer('port'),

    /**
     * Printer model for driver/capability selection.
     * Different models support different features (paper width,
     * cut modes, barcode printing, logo support).
     */
    model: varchar('model', { length: 255 }),

    // ── ASSIGNMENT ────────────────────────────────────────────────────

    /**
     * Workstation this printer serves.
     * - set: kitchen printer for this workstation
     * - null: receipt printer (not tied to a workstation)
     */
    workstationId: uuid('workstation_id').references(() => workStation.id, {
      onDelete: 'set null',
    }),

    /** Whether the printer is currently active */
    isActive: boolean('is_active').notNull().default(true),

    ...timestamps,
  },
  t => [
    /** Printer names must be unique per organization */
    uniqueIndex('printer_org_name_unique').on(t.organizationId, t.name),

    /* Optimizes: Get all active printers for organization */
    index('idx_printer_org_active').on(t.organizationId, t.isActive),
    /* Optimizes: Find printer for a workstation */
    index('idx_printer_org_workstation').on(t.organizationId, t.workstationId),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const printerRelations = relations(printer, ({ one }) => ({
  organization: one(organization, {
    fields: [printer.organizationId],
    references: [organization.id],
  }),
  workstation: one(workStation, {
    fields: [printer.workstationId],
    references: [workStation.id],
  }),
}));

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

export const SelectPrinterSchema = createSelectSchema(printer);
export const InsertPrinterSchema = createInsertSchema(printer, {
  name: field => field.min(1).max(255),
  ipAddress: field => field.max(45).optional().nullable(),
  port: field => field.int().min(1).max(65535).optional().nullable(),
  model: field => field.max(255).optional().nullable(),
}).omit({
  organizationId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export const PatchPrinterSchema = InsertPrinterSchema.partial();

// ============================================================================
// TYPES
// ============================================================================

export type SelectPrinterType = typeof printer.$inferSelect;
export type InsertPrinterInputType = z.infer<typeof InsertPrinterSchema>;
export type PatchPrinterInputType = z.infer<typeof PatchPrinterSchema>;

export default printer;
