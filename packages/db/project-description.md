# Restaurant POS System — Project Description & Requirements

## Overview

A multi-tenant restaurant Point of Sale (POS) system designed for dine-in service. The system manages the full lifecycle of a restaurant visit — from seating guests to processing payment — across multiple terminals operated by different staff members simultaneously.

Each restaurant operates as an independent tenant (organization) with its own menu catalog, floor plan, staff, and settings.

## Tech Stack

- **Frontend:** Next.js (TypeScript)
- **Backend:** Hono with Bun runtime
- **Auth:** Better Auth with organizations plugin
- **Database:** PostgreSQL (Neon) with Drizzle ORM
- **API:** oRPC for type-safe communication
- **Monorepo:** Turborepo
- **Real-time:** WebSocket for multi-terminal sync

---

## System Modules

### 1. Menu Catalog

The menu system that defines what the restaurant sells.

**Catalogs** — Menu collections with time-based availability (breakfast, lunch, dinner, seasonal). Each catalog contains categories and can be scheduled by time of day and day of week.

**Categories** — Logical groupings of products (Starters, Mains, Drinks, Desserts). Each category is assigned to a workstation for kitchen routing.

**Products** — Individual menu items with a name, base price (stored in cents), and optional workstation override for routing.

**Modifier Groups** — Collections of customization options attached to a product (Size, Toppings, Sugar Level). Each group defines selection rules: single vs multiple select, required vs optional, min/max selections.

**Modifiers** — Individual options within a group (Small/Medium/Large, Extra Cheese, No Onions). Each has a price adjustment and display order.

**Modifier Dependencies** — Conditional relationships between modifiers for dynamic pricing and visibility. Example: Costa Rica coffee costs €2.80 for Regular size but €3.80 for XLarge. Sugar Type options are hidden when "No Sugar" is selected.

**Workstations** — Physical preparation areas (Main Kitchen, Cold Kitchen, Bar). Products and categories route to workstations so the kitchen display system shows the right items to the right station.

**Offers** — Pre-configured promotions and discounts (Happy Hour 20% off drinks, BOGO burgers, €5 off orders over €30). Supports percentage, fixed amount, fixed price, and BOGO discount types. Scoped to products, categories, or entire orders. Configurable by time, day, and date range with priority and stacking rules.

### 2. Floor Plan & Table Management

The physical layout of the restaurant.

**Zones** — Distinct physical areas (Ground Floor, Terrace, Beach, VIP Room). Zones can be toggled active/inactive for seasonal areas.

**Tables** — Individual dining spots within zones. Each table has a short label (T1, T5-6, Bar 3), seating capacity, and active status. Tables can be created dynamically (joining T5+T6 into T5-6). A table can have at most one open order at a time.

### 3. Order System

The core operational system managing active dining sessions.

**Orders** — One order per table at a time, following the Toast/Lightspeed industry standard. An order represents a single dining session from seating to payment. Multiple waiters can add items to the same order simultaneously via WebSocket sync.

**Order lifecycle:** `open → closed | voided`

**Rounds** — Items are added to an order over time and "fired" to the kitchen in batches (rounds). The waiter controls when items are sent. Round 1 might be drinks, Round 2 food, Round 3 desserts. Items start with no round assignment (unfired) and receive a round number when the waiter fires them.

**Order Items** — Individual products within an order. Prices and product names are snapshotted at order time (denormalized from catalog) to preserve price integrity — if the menu changes tomorrow, existing orders keep their original pricing. The catalog product is still referenced by ID for analytics.

Each item tracks its own status independently for KDS routing:
- `new` — added to order, not yet sent to kitchen
- `sent` — fired to the appropriate workstation
- `preparing` — kitchen acknowledged, actively working
- `ready` — prepared, waiting for pickup
- `served` — delivered to the customer
- `voided` — cancelled at any point

**Order Item Modifiers** — Modifier choices snapshotted at order time, preserving the modifier name and price adjustment from the moment the item was added.

**Cached Totals** — The order maintains cached subtotal, discount total, tax total, and final total. These are recalculated on every mutation (add item, void item, apply discount) within the same database transaction. This avoids stale data while providing instant reads for the waiter screen and WebSocket broadcasts.

### 4. Kitchen Display System (KDS)

Digital order display for kitchen and bar stations. No separate ticket table — following the Toast pattern, tickets are derived views.

**Ticket rendering** — The KDS screen queries items by workstation and status, grouping them by order and round. Each "ticket" shows: table number, order number, round, items with modifiers, and time elapsed since firing.

**Item fulfillment** — Kitchen staff mark individual items as fulfilled (ready). When all items on a ticket are fulfilled, the ticket disappears. If an item is voided or changed after firing, the ticket reappears marked as changed/recalled.

**Workstation routing** — Items route to workstations based on the product's workstation override, falling back to the category's workstation. The same order can produce tickets at multiple stations (drinks to Bar, food to Kitchen).

**Cancellation** — When an item is voided after being sent to the kitchen, the KDS shows a cancellation notification and can trigger a cancellation print at the relevant workstation.

### 5. Discounts

Three discount scopes across two lifecycle stages.

#### During Service (orderDiscount)

**Order-level discounts** — Applied to the entire order during service. Examples: "10% off regular customer", "15% off for long wait", "20% staff discount". Stored with `orderItemId: null`.

**Item-level discounts** — Applied to a specific item during service. Examples: "Comp the soup (waiter dropped it)", "Free birthday dessert", "50% off wine (bottle was open)". Stored with `orderItemId` referencing the specific item.

#### At Payment (checkDiscount)

**Check-level discounts** — Applied after bill splitting to a specific check. Examples: "5% staff discount on Maria's check only", "€3 off check 2 as manager comp", "10% off remaining bill after split". Minimal table — no priority/stacking logic, removed by deleting the row.

#### Discount Properties

All discounts share core properties:
- **Type & value** — percentage, fixed amount, or fixed price (rules-only, no pre-computed amount)
- **Source** — catalog offer (linked via offerId) or ad-hoc (manual, offerId null)
- **Accountability** — who applied it (appliedById), reason text, and optional manager approval (approvedById)
- **Stacking** — multiple discounts can coexist on the same order or check

Order discounts additionally snapshot offer metadata (name, priority, stackability) at application time so catalog changes don't affect active orders. They use a revoke pattern (revokedAt/revokedById/revokeReason) instead of hard delete for removal during service.

Authorization thresholds (e.g., "waiters can give up to 10%, above requires manager PIN") are enforced in application logic, not the schema. The schema records whether approval happened.

### 6. Billing & Payments

Created at payment time, not during service. Checks are the frozen financial record.

**Checks** — Bills generated from an order. A simple (no split) order has one check covering all items. Split bills create multiple checks.

Split methods supported:
- **By product** — each person pays for their specific items
- **By seat** — items tagged with seat numbers go to corresponding checks
- **By quantity** — 3× Beer split as 2 on check A, 1 on check B
- **By amount** — fixed amounts split across checks
- **By percentage** — proportional split
- **Any combination** of the above

When checks are created, order-level discounts are distributed proportionally across checks. Item-level discounts follow their specific items to the appropriate check. Paid amount is computed on the fly from the payments table rather than cached on the check.

**Check lifecycle:** `open → partially_paid → paid | voided`

**Check Items** — Junction table assigning order items to checks with quantity. For split-by-product, each item goes to exactly one check. For split-by-quantity, the same item can appear on multiple checks with different quantities that must sum to the original order item quantity.

**Payments** — Individual transactions against a check. One check can have multiple payments (partial card + cash, multiple cards). Each payment records: method (cash/card/other), amount, tip amount, external reference (card processor transaction ID), and the staff member who processed it.

**Payment lifecycle:** `completed | refunded | failed`

### 7. Audit Log

Complete accountability trail, separate from operational data. Follows the WorkOS/GitHub industry pattern.

Every entry answers: WHO (actor) did WHAT (action) to WHICH entity (target), WHERE (device/location), and WHEN.

- **Append-only** — no updates, no deletes
- **Lightweight** — references and summaries, not full data snapshots
- **Queryable** — indexed columns for common filters, JSONB for flexible details
- **Decoupled** — not the event bus or WebSocket system

Examples:
- `order.created` — Maria created Order #42 on Table T5
- `order.item_added` — Maria added 2× Beer, 1× Wine
- `order.round_fired` — Maria fired Round 1 to Bar
- `order.item_voided` — Kostas voided 1× Wine (reason: wrong order)
- `order.discount_applied` — Kostas applied 10% off (regular customer)
- `payment.completed` — Maria processed card payment €34.50
- `product.updated` — Admin changed Margherita price from €8.00 to €9.50

### 8. Printers

Connection details stored in the database for admin panel management without redeploys.

**Printer role** is determined by `workstationId` — no separate type enum:
- **Kitchen printers** (`workstationId` set) — tied to a workstation. Print order tickets when items are fired and cancellation slips when items are voided.
- **Receipt printers** (`workstationId` null) — standalone, used by POS terminals to print customer receipts at payment time.

**Connection types:** network (TCP/IP with IP address and port), USB, or Bluetooth. Model field drives driver/capability selection (paper width, cut modes, barcode support).

A workstation can have multiple printers for backup/redundancy.

### 9. Authentication & Multi-Tenancy

Built on Better Auth with the organizations plugin.

- Users can belong to multiple organizations (restaurants)
- Each user has a role per organization (owner, manager, waiter, kitchen)
- All data is scoped by `organizationId` — every table has this foreign key
- Session management handles switching between organizations
- Invitation system for adding staff to a restaurant

---

## Database Schema Summary

### Existing Tables (catalog & config)
- `catalog` — menu collections with scheduling
- `category` — product groupings with workstation assignment
- `product` — menu items with pricing
- `modifier_group` — customization option groups
- `modifier` — individual customization options
- `modifier_option_dependency` — conditional pricing/visibility
- `workstation` — kitchen/bar preparation stations
- `offer` — pre-configured promotions
- `offer_category` — offer ↔ category junction
- `offer_product` — offer ↔ product junction
- `restaurant` — business details and tax info
- `audit_log` — accountability trail
- Better Auth tables (user, organization, session, etc.)

### Order System Tables (new)
- `zone` — physical restaurant areas
- `table` — dining tables within zones
- `order` — one per table session, cached totals
- `order_item` — snapshotted products, KDS status, rounds
- `order_item_modifier` — snapshotted modifier choices
- `order_discount` — discount rules during service (with offer snapshots + revoke pattern)
- `check` — frozen financial record at payment
- `check_item` — item ↔ check junction (with quantity for partial splits)
- `check_discount` — post-split discount rules (minimal)
- `payment` — transactions against checks
- `printer` — kitchen and receipt printers with connection details

---

## Key Design Decisions

1. **One order per table** — industry standard (Toast, Lightspeed). Rounds handle firing, checks handle splitting. Avoids complexity of aggregating across multiple orders.

2. **Price snapshots on order items** — product name and price frozen at order time. Catalog product still referenced by ID for analytics. No product versioning — the order IS the historical record.

3. **Discounts as rules, not pre-computed amounts** — discount rows store type + value. Actual amounts computed live during service, frozen on checks at payment time. Prevents stale cached amounts when items change.

4. **Offer metadata snapshotted on discounts** — offer name, priority, and stackability frozen at application time. Renaming "Happy Hour" to "Sunset Special" doesn't rewrite active orders.

5. **Revoke pattern for order discounts** — revokedAt/revokedById/revokeReason instead of hard delete during service. Preserves the record while excluding from calculations. Check discounts use hard delete (simpler lifecycle).

6. **Cached totals on orders, recalculated per mutation** — server computes totals on every add/void/discount in the same transaction. Provides instant reads without staleness risk. Checks freeze final numbers.

7. **Paid amount computed, not cached** — `SUM(payment.amount WHERE status = 'completed')` instead of a cached field on check. Checks rarely have more than 1-2 payments, trivial join.

8. **KDS tickets are derived views, not stored entities** — following Toast's pattern. Items grouped by order + round + workstation at query time. No separate ticket table. Voids/changes reflected in real-time via item status.

9. **Two discount tables by lifecycle** — `orderDiscount` during service (full featured), `checkDiscount` at payment (minimal). Clean separation, clear parent, no nullable FK confusion.

10. **Printer role derived from FK** — `workstationId` set = kitchen printer, null = receipt printer. No redundant type enum or boolean. Same pattern as discount scope derived from nullable `orderItemId`.

11. **Audit log separate from order data** — orders hold current state, audit log holds complete history. Different retention, different query patterns, different access control.

12. **Server-side calculation only** — client submits product/modifier selections, server looks up prices and computes all totals. Never trust client-submitted amounts.

## Future Additions

- **Course system** — configurable courses with pacing rules (manual, on_previous_served, timed)
- **Print log** — record of every print job for reprints and history tracking
- **Scheduled firing** — `scheduledFireAt` on orderItem for timed auto-fire to kitchen
