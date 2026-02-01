# POS System Modifier Architecture: Design Guide for Multi-Tenant SaaS

> **TL;DR:** Major POS systems (Toast, Square, Lightspeed, Clover) universally implement a hierarchical modifier architecture separating **Modifier Groups** (containers with selection rules) from **Modifier Options** (individual choices). For your PostgreSQL-based multi-tenant SaaS, implement a hybrid storage model: normalized relational tables for pricing/inventory integrity (supporting many-to-many product relationships and price snapshots), with JSONB columns for flexible display logic. Support additive, size-scaled, threshold (first-N-free), and substitution pricing; enforce mandatory/optional constraints and single/multi-select cardinality; and store orders with immutable price snapshots to prevent historical data corruption. Avoid excessive nesting (max 2-3 levels), ensure inventory linkage for all consumable modifiers, and distinguish carefully between Variants (distinct SKUs like sizes) and Modifiers (adjustments like toppings).

---

## 1. Industry Standards in Major POS Systems

Modern POS platforms employ distinct architectural patterns for modifier management, each optimized for specific operational scales and integration requirements. While all systems share core concepts of grouping options and applying them to products, their implementation details vary significantly in hierarchy depth, pricing granularity, and catalog management.

| System | Core Entities | Hierarchy Depth | Pricing Model | Key Differentiator |
|--------|---------------|-----------------|---------------|-------------------|
| Toast | ModifierGroup, ModifierOption, Pre-Modifiers | Unlimited nesting | Additive, Substitution, Size-Sequence | Nested conditional logic, Prep Station routing |
| Square | CatalogModifierList, CatalogModifier, OrderLineItemModifier | Flat (single level) | Fixed, Percentage | Catalog versioning, uid-based order tracking |
| Clover | Order, LineItem, Modification | Flexible (API-driven) | Dynamic overrides | Ad-hoc custom modifiers, webhook inventory sync |
| Lightspeed | On-Screen Modifiers, Option Sets, Product Variants | 2-3 levels recommended | Tiered, Override | Universal vs. Product-linked scope distinction |

### 1.1 Toast POS Architecture

#### 1.1.1 Core Modifier Entities (ModifierGroup, ModifierOption)

Toast POS implements a sophisticated two-tier entity model where **ModifierGroup** serves as the categorical container (e.g., "Toppings," "Milk Options") and **ModifierOption** represents the selectable values within those categories (e.g., "Pepperoni," "Almond Milk"). The ModifierGroup entity carries critical configuration metadata including `guid` for unique identification, `multiLocationId` for enterprise consistency, and display properties (`posName`, `posButtonColorLight`, `posButtonColorDark`) that control terminal presentation. Each ModifierOption maintains independent pricing, availability schedules, and portion specifications through the Portion schema, enabling precise ingredient depletion calculations when modifiers are selected. This architecture supports a many-to-many relationship between products and modifier groups, allowing a single "Cheese Options" group to be shared across burgers, sandwiches, and salads while maintaining product-specific overrides for pricing or availability.

#### 1.1.2 Pricing Configuration (defaultOptionsChargePrice, Substitution Pricing)

Toast's pricing engine distinguishes between **additive pricing** (modifier adds fixed amount), **substitution pricing** (swapping included items), and **inclusion pricing** (first-N-free logic). The `defaultOptionsChargePrice` boolean determines whether pre-selected default modifiers contribute to the base price—when set to `"YES"`, default modifiers add to the displayed price; when `"NO"`, they are implicitly included. Substitution pricing enables value-transfer calculations where removing a default modifier (e.g., chicken from a salad valued at $7) creates a credit applied toward an alternative selection (e.g., salmon at $9), resulting in a net $2 upcharge rather than charging the full $9. This requires `defaultOptionsChargePrice` set to `"NO"` to function correctly, ensuring default modifiers carry intrinsic value without being explicitly itemized in the base price.

#### 1.1.3 Selection Constraints (requiredMode, isMultiSelect, min/max Selections)

Toast enforces selection constraints through the `requiredMode` field (values: `"REQUIRED"`, `"OPTIONAL_FORCE_SHOW"`, `"OPTIONAL"`) and cardinality controls via `isMultiSelect` and `maxSelections`. Required modifiers force staff to make selections before proceeding, essential for operational requirements like cooking temperature or pizza size. Single-select groups automatically enforce `maxSelections: 1` and prevent duplicates through `allowsDuplicates` flags, while multi-select groups support numeric minimums and maximums (e.g., "Choose 2-4 toppings"). The system validates these constraints at the API level, rejecting orders that violate rules such as specifying multiple modifiers for a single-select group.

#### 1.1.4 Nested Modifier Support (Conditional Display Logic)

Toast supports unlimited nesting depth through parent-child relationships where selecting a modifier option triggers the display of secondary modifier groups. For example, selecting "Side: Fries" might reveal nested groups for "Fry Size" and "Fry Seasoning," while selecting "Side: Salad" reveals "Dressing Choice" and "Add Croutons." This is implemented through recursive `modifiers` arrays within modifier objects, enabling complex conditional logic where options only appear when parent modifiers are selected. However, Toast documentation notes significant limitations: pre-modifiers (prefixes like "NO" or "EXTRA") are not supported in Online Ordering or Toast Mobile Order & Pay, creating potential inconsistencies between in-store and digital channels that require careful menu design to mitigate.

### 1.2 Square POS Architecture

#### 1.2.1 Catalog Object Hierarchy (CatalogModifierList, CatalogModifier)

Square POS organizes modifiers through its Catalog API, utilizing **CatalogModifierList** objects (equivalent to modifier groups) that contain **CatalogModifier** entities (individual options). This catalog-centric approach treats modifiers as first-class objects with unique `catalog_object_id` values, enabling consistent tracking across Square's ecosystem of payment terminals, online stores, and third-party integrations. Each CatalogModifier maintains `name`, `price_money` (integer in smallest currency unit), and optional `ordinal` values controlling display order. The architecture emphasizes catalog versioning through `catalog_version` fields, ensuring that historical orders reference the specific version of the modifier active at the time of purchase, even if the catalog definition changes subsequently.

#### 1.2.2 Order Line Item Modifier Structure (uid, catalog_object_id, quantity)

When modifiers are applied to orders, Square creates **OrderLineItemModifier** objects that link to catalog definitions while maintaining order-specific context. Each modifier application receives a unique `uid` (limited to 60 characters) for the specific order instance, distinguishing it from the underlying `catalog_object_id` that references the master definition. The structure supports quantity-based modifiers, allowing customers to order "2x Extra Cheese" through the `quantity` field, which accepts string values representing numeric amounts. This separation between catalog reference and order instance allows Square to preserve historical pricing accuracy while maintaining referential integrity for reporting and analytics.

#### 1.2.3 Pricing Calculation Methods (base_price_money, total_price_money)

Square's pricing model explicitly separates `base_price_money` (the unit price for the modifier) from `total_price_money` (the calculated line total). The `base_price_money` field captures the price at the time of order creation as an integer (e.g., 150 for $1.50), preventing floating-point rounding errors, while `total_price_money` is calculated as `base_price_money × modifier_quantity × line_item_quantity` and marked as read-only to prevent client-side manipulation. This structure supports both ad-hoc modifiers (requiring `base_price_money` when `catalog_object_id` is absent) and catalog-backed modifiers, providing flexibility for special requests while maintaining audit trails for standard offerings.

### 1.3 Clover POS Architecture

#### 1.3.1 Custom Order Creation Patterns

Clover POS employs a workflow-oriented API design that separates order creation into discrete steps: creating an Order object with "open" status, adding LineItems (referencing inventory items or custom ad-hoc entries), and applying Modifications through dedicated endpoints. This approach supports both predefined catalog modifiers and dynamic custom modifications, allowing restaurants to handle special requests that fall outside standard menu configurations. The platform calculates order totals dynamically based on the merchant's active register app, requiring external systems to either poll for updated totals or implement independent calculation logic based on known pricing rules.

#### 1.3.2 Line Item and Modifier Association Models

Clover's data model maintains strict separation between the product catalog (template definitions) and order instances (specific selections). Modifiers are linked to line items through the `modifications` relationship, capturing the modifier ID, name, and price at the time of application. Unlike Toast's hierarchical model, Clover supports flexible modifier application where modifications can carry their own pricing information and inventory implications, enabling complex substitutions (like "Swap fries for salad") to be modeled as separate line items with parent-child relationships or as embedded modifications with negative pricing.

### 1.4 Lightspeed POS Architecture

#### 1.4.1 On-Screen Modifiers (Universal Application)

Lightspeed Restaurant distinguishes between **On-Screen Modifiers**—universal options available across all products during order entry—and product-specific configurations. On-screen modifiers function as global buttons on the POS interface, ideal for common instructions like "No Onions," "Extra Hot," or "To Go" that apply across diverse menu categories. These modifiers support prefixes (No, Extra, Side, Light) that modify the semantic meaning of selections without requiring separate catalog entries, streamlining the modifier taxonomy while maintaining kitchen clarity. The system allows up to 54 modifiers per modifier group, with layout configuration determining button placement on POS terminals.

#### 1.4.2 Product-Linked Option Sets (Targeted Application)

For item-specific modifications, Lightspeed uses **Option Sets** explicitly linked to individual products or categories, ensuring relevant options only appear when appropriate items are selected. Unlike universal on-screen modifiers, Option Sets support automated pricing, inventory tracking, and Kitchen Display System (KDS) routing, making them essential for structured customization like pizza toppings or burger add-ons. Option Sets can contain both modifiers and products, enabling complex configurations where selecting a modifier might effectively add a sub-product to the order (such as "Add Side Salad" triggering dressing selections).

#### 1.4.3 Modifier Group Visibility Rules

Lightspeed implements sophisticated visibility controls determining when modifier groups appear during order entry. The "Auto-Prompt on POS" setting controls whether groups display automatically (forced), only when requested (manual), or conditionally based on other selections. This granular control extends to channel-specific exposure, allowing certain modifiers to appear in-store but not online, or vice versa. The platform also supports **Chain to Group** functionality, where selecting a menu item automatically displays associated modifier groups in a specified sequence, streamlining the order entry process for complex items.

### 1.5 Common Entity Relationships

#### 1.5.1 Many-to-Many Product-Modifier Group Associations

Across all major platforms, the many-to-many relationship between products and modifier groups represents a fundamental pattern. A single modifier group (such as "Cheese Options") can be associated with multiple products (burgers, sandwiches, salads), while a single product can have multiple modifier groups (size, temperature, add-ons). This is typically implemented through a junction table (e.g., `product_modifier_groups`) storing associations along with product-specific overrides for pricing or default selections. This pattern reduces data duplication—updating the price of "Extra Cheese" once propagates to all associated products—while allowing exceptions through override fields in the junction table.

#### 1.5.2 Hierarchical Modifier Group Nesting

Hierarchical nesting enables conditional logic flows where selecting a modifier reveals additional options. Toast and Otter POS demonstrate this pattern: selecting "Side: Fries" might reveal "Fry Size" and "Fry Seasoning" options, while selecting "Side: Salad" reveals "Dressing Choice." This parent-child relationship is implemented through recursive foreign keys or adjacency list models where modifier options reference their "child modifier group" identifier. While Toast supports unlimited nesting theoretically, practical implementations should limit depth to 2-3 levels to prevent UI complexity and performance degradation. Additionally, not all online ordering platforms support nested modifiers, requiring "flattening" of the menu structure for those channels.

#### 1.5.3 Inventory Item Linkage for Consumption Tracking

Enterprise POS systems increasingly require inventory linkage where modifiers deplete stock for accurate cost tracking. Toast's Portion schema and Clover's inventory integration both support specifying ingredient quantities consumed when a modifier is selected. For example, "Add Avocado" to a burger should deplete avocado inventory by a specific portion amount, distinct from "Add Avocado" to a salad which might use a different portion. This requires modifiers to maintain references to inventory items or recipes, not just pricing information, creating a three-way relationship between products, modifiers, and inventory. Restaurant365 emphasizes that modifiers should be treated as regular menu items for inventory purposes, with each modifier potentially linked to a recipe defining ingredient depletion.

---

## 2. Data Model Patterns

### 2.1 Core Conceptual Distinctions

Understanding the semantic differences between Modifiers, Variants, and Option Sets is essential for designing a POS system that scales across diverse restaurant types while maintaining data integrity.

| Concept | Definition | Example | Inventory Impact | Pricing Model |
|---------|------------|---------|------------------|---------------|
| Modifiers | Adjustments to base items that don't change product identity | "Extra Cheese," "No Onions," "Rare Temperature" | May deplete inventory (portions) | Additive or substitution-based |
| Variants | Distinct versions of a product with separate SKUs | Small/Medium/Large, Vanilla/Chocolate/Strawberry | Separate inventory tracking | Base price replacement |
| Option Sets | Collections of modifiers specific to a product or category | "Pizza Toppings" for BYO Pizza, "Burger Add-ons" | Depends on contained modifiers | Container-level rules |

#### 2.1.1 Modifiers (Adjustments and Enhancements to Base Items)

Modifiers represent adjustments, additions, or specifications applied to base products that alter the final prepared item without creating a distinct product SKU. They answer the question "How would you like that prepared?" rather than "What would you like to order?" Examples include preparation methods ("Well Done"), ingredient additions ("Extra Cheese"), or removals ("No Onions"). Modifiers typically affect pricing additively—the base price remains constant while modifiers add (or occasionally subtract) value—and they may or may not affect inventory consumption depending on whether they represent physical ingredients. In database terms, modifiers are children of line items, not independent products, and require many-to-many junction tables linking orders to modifier options with quantity and price snapshot fields.

#### 2.1.2 Variants (Distinct Product Versions: Size, Flavor, Type)

Variants represent distinct, pre-defined versions of a base product that exist as separate SKUs or catalog entries, typically differing in attributes like size, flavor, or material composition. Unlike modifiers, variants determine the base price of the line item and often change which modifier groups are available or how modifier pricing is calculated. For example, a "Large Pizza" variant might have a base price of $18.00 compared to the Medium's $14.00, with toppings also costing more ($2.00 vs $1.50) to reflect the larger portion. Variants require independent inventory tracking (different dough weights, cup sizes) and often have different tax classifications. In database schemas, variants usually exist as separate rows in the products table or a dedicated variants table with foreign keys to the parent product.

#### 2.1.3 Option Sets (Product-Specific Modifier Collections)

Option Sets (or Modifier Groups) serve as organizational containers that group related modifiers into logical collections applicable to specific products or categories. An Option Set carries configuration properties independent of its individual options, such as whether selection is required, whether multiple selections are allowed, minimum and maximum selection counts, and default selections. Lightspeed distinguishes Option Sets from universal On-Screen Modifiers by their targeting: Option Sets are explicitly linked to specific products, making them ideal for unique configurations like "Signature Pizza Toppings" that don't apply to the broader category. This encapsulation reduces configuration duplication and ensures consistent presentation across similar products while preventing interface clutter from irrelevant options.

### 2.2 Storage Strategy Trade-offs

The decision between normalized relational storage and denormalized JSON/Array storage for modifier configurations involves significant trade-offs between query performance, data integrity, schema flexibility, and operational complexity.

#### 2.2.1 Normalized Relational Models (Separate Tables for Groups/Options)

Normalized relational models store modifier groups, modifier options, and product associations in separate tables with foreign key relationships. A typical PostgreSQL implementation includes tables for:

- `modifier_groups` (id, name, required_mode, min_selections, max_selections)
- `modifier_options` (id, group_id, name, price, inventory_item_id)
- `product_modifier_groups` (product_id, group_id, display_order, override_price)

This approach enforces referential integrity through database constraints, enables efficient querying of specific modifier attributes (e.g., "find all products that have a modifier priced over $1"), and supports complex reporting aggregations across orders. However, normalized models require complex join operations to retrieve complete modifier configurations, which can impact performance when rendering menus with hundreds of products each having multiple modifier groups.

#### 2.2.2 Denormalized JSON/Array Storage (PostgreSQL JSONB)

Denormalized JSON storage stores modifier configurations as JSONB columns within the products table, such as:

```json
{
  "modifiers": [
    {
      "group_name": "Cheese",
      "options": [{"name": "Cheddar", "price": 0.50}],
      "max_selections": 2
    }
  ]
}
```

This eliminates join overhead and allows atomic retrieval of product configurations, significantly improving read performance for menu display purposes. PostgreSQL's JSONB indexing capabilities (GIN indexes) can mitigate query performance concerns for simple containment queries, but complex aggregations or searches within JSON arrays become cumbersome as data volumes grow. Additionally, JSON storage sacrifices referential integrity—database constraints cannot enforce that a modifier ID stored in JSON actually exists in the catalog, and updating modifier pricing requires batch processing of all product records containing that modifier.

#### 2.2.3 Hybrid Approaches (Metadata in JSON, Pricing in Relational)

Hybrid approaches attempt to balance these trade-offs by storing structural metadata (group relationships, selection rules) in normalized tables while storing presentation metadata (display names, descriptions, conditional logic) in JSON columns. Pricing information and inventory linkage typically remain relational to support accurate order total calculations and reporting. For example, current modifier definitions might reside in relational tables for maintainability, while completed order line items store snapshots of selected modifiers in JSONB to preserve historical accuracy even if catalog definitions change later. This approach maintains referential integrity for critical business logic while allowing flexibility for frontend-specific attributes that change frequently, making it particularly suitable for multi-tenant SaaS systems where tenant-specific customizations are required without schema migrations.

### 2.3 Scope and Reusability Patterns

#### 2.3.1 Global Shared Modifier Groups (Milk Options, Cooking Temperatures)

Global shared modifier groups are defined at the tenant or enterprise level and can be associated with multiple products. Examples include:

- "Milk Options" (Whole, Skim, Almond, Oat) for coffee shops
- "Cooking Temperatures" (Rare, Medium Rare, Medium, Well) for steakhouses
- "Preparation Instructions" (No Salt, Light Oil, Well Done)

These groups are defined once and associated with multiple products through many-to-many junction tables, ensuring consistency across the menu while minimizing administrative overhead. When a global group is updated (such as adding Oat Milk to the Milk Options), the change propagates to all associated products automatically. However, global groups require careful management of pricing overrides, as the cost of "Add Bacon" might differ between a breakfast sandwich and a dinner entrée despite using the same modifier group.

#### 2.3.2 Product-Specific Modifier Groups (Pizza Toppings, Burger Add-ons)

Product-specific modifier groups handle unique customization options that only apply to individual items or narrow categories. A "Pizza Toppings" group might be specific to pizza products, while "Burger Add-ons" applies only to hamburger variations. These groups allow highly specific pricing and availability without cluttering the global namespace. In enterprise POS systems, product-specific groups often inherit from template groups but allow local overrides, creating a "copy-on-write" pattern where changes to the template propagate to all instances unless explicitly overridden at the product level. While this approach increases database size compared to global groups, it prevents interface clutter and reduces order entry errors by showing only relevant options.

#### 2.3.3 Category-Level Inheritance with Product Overrides

Category-level inheritance provides a middle ground, where modifier groups are associated with product categories (such as "Beverages" or "Entrees") and automatically apply to all products within that category unless explicitly excluded or overridden. For example, when a new burger is added to the "Burgers" category, it automatically inherits the "Temperature", "Cheese", and "Add-ons" modifier groups associated with that category. Category inheritance typically supports override mechanisms where individual products can add additional groups or modify the behavior of inherited groups (such as making "Temperature" optional for a specific burger that only comes well-done). This pattern simplifies menu setup for large catalogs but requires careful handling of override semantics to ensure product-specific settings take precedence over category defaults.

---

## 3. Pricing Complexity

### 3.1 Additive Pricing Models

#### 3.1.1 Fixed Amount Surcharges (Extra Cheese +$1.50)

Fixed amount surcharges represent the simplest modifier pricing model, where selecting a modifier adds a predetermined monetary amount to the base item price. For example, "Extra Cheese" might add $1.50 to any burger, regardless of size or other modifiers. This model is straightforward to implement and communicate to customers but lacks flexibility for scenarios where the cost of a modifier varies based on context. Square's API implements this through the `price_money` field on CatalogModifier objects, storing values as integers in the smallest currency unit (e.g., 150 cents for $1.50) to avoid floating-point errors. Fixed pricing requires careful handling of currency rounding and tax implications, as modifier surcharges typically inherit the tax classification of the base product.

#### 3.1.2 Percentage-Based Markups (Premium Ingredients +20%)

Percentage-based markups apply a percentage increase to the base item price, commonly used for premium ingredients like "Add Lobster" (+25%) or "Upgrade to Wagyu Beef" (+40%). This model ensures that modifier pricing scales appropriately with the base product value—adding lobster to a $10 pasta dish costs less than adding it to a $30 pasta dish, reflecting actual ingredient cost differences. Implementation requires calculating the modifier price dynamically based on the current base price at the time of order, with the percentage stored as a decimal value (0.25 for 25%) on the modifier option. Care must be taken to handle currency rounding and to snapshot the calculated price at order time to prevent pricing changes from affecting historical orders.

### 3.2 Size-Based and Tiered Pricing

#### 3.2.1 Base Price Replacement by Size Variant

When size is implemented as a product variant rather than a modifier, selecting a size replaces the entire base price of the item rather than adding to a standard base. In this model, each size variant has an independent base price (Small Pizza $12, Medium $16, Large $20), and modifier prices may also scale with the size. This approach is technically variant pricing rather than modifier pricing, but it interacts with modifier systems because size selection often determines which modifier groups are available or how modifier pricing is calculated. For example, a "Large" pizza variant might allow up to 8 toppings while a "Small" allows only 5, or topping prices might be higher on the Large due to increased ingredient portions.

#### 3.2.2 Modifier Price Scaling with Size (Large Toppings Cost More)

Modifier price scaling links modifier costs to the selected size without requiring separate variant SKUs for each modifier. The system maintains a base modifier price (e.g., $1.50 for toppings) and applies multipliers based on the selected size:

- Small (0.8x = $1.20)
- Medium (1.0x = $1.50)
- Large (1.3x = $1.95)

Toast implements this through `SizeSequencePricingRule` configurations where the `pricingRules` object contains size-specific pricing matrices for modifier options. This requires the system to determine the current size selection before calculating modifier prices, creating a dependency chain where size must be selected (or defaulted) before modifier prices can be displayed accurately.

### 3.3 Included and Threshold Pricing

#### 3.3.1 First-N-Free Logic (First 3 Toppings Included)

First-N-Free logic implements promotional pricing where a certain number of modifiers from a group are included in the base price, with additional selections incurring charges. The classic example is pizza toppings: "First 3 toppings free, $0.50 each additional."

This requires the system to track the count of selected modifiers within a group and apply pricing only to selections beyond the threshold. Implementation approaches include storing an `included_count` field on the modifier group (e.g., 3) and an `additional_price` field (e.g., 0.50), then calculating the charge as:

```
max(0, (selected_count - included_count) * additional_price)
```

This logic must handle edge cases such as removing and re-adding modifiers to ensure the customer is never overcharged, and must account for different modifier "weights" if premium toppings count as multiple regular toppings against the free allowance.

#### 3.3.2 Incremental Pricing Beyond Threshold (4th+ Topping +$0.50)

Beyond the free threshold, incremental pricing applies per-item charges. The 4th, 5th, and subsequent toppings each add $0.50 to the order total. Some systems implement progressive pricing where:

- 4th topping costs $0.50
- 5th topping costs $0.75
- 6th topping costs $1.00

This discourages excessive modifications that complicate kitchen operations. Toast's sequence pricing feature supports this through `SequencePrice` objects within `SizeSequencePricingRule` configurations, where each position in the sequence specifies the price for the nth selection. The complexity increases when combining sequence pricing with size-based pricing, as the system must resolve both dimensions when calculating modifier costs.

### 3.4 Combo and Bundle Pricing

#### 3.4.1 Modifier Inclusion in Combo Meals (Free Drink with Burger)

Combo meals introduce complex pricing logic where modifiers may be included at no additional charge as part of a bundled offering. For example, a "Burger Combo" might include a free drink and free side, where the drink and side are actually modifiers selected from modifier groups that normally carry charges. This requires the ability to override modifier pricing at the product level or through promotional rules, setting specific modifier prices to $0.00 when part of a combo. The system must distinguish between "included modifiers" (no charge, but still affect inventory) and "paid modifiers" (standard pricing), which may require separate line item treatment or special pricing flags.

#### 3.4.2 Substitution Pricing (Swap Fries for Salad +$2.00)

Substitution pricing (also called "swap pricing" or "exchange pricing") allows customers to substitute one included item for another, paying only the price difference. Toast's substitution pricing feature enables scenarios where a salad includes chicken by default (valued at $7), but the customer can substitute salmon (valued at $9) and pay only the $2.00 difference rather than the full $9.00 salmon add-on price.

This requires modifiers to maintain their individual prices even when included by default, and the system must calculate the net difference between removed and added modifiers. Otter POS describes negative modifiers that reduce the total order price when selected, such as choosing "Water" in a combo meal that normally includes a $2.00 soda, resulting in a -$1.00 adjustment to the combo price.

---

## 4. Selection Rules and Validation

### 4.1 Requirement Levels

#### 4.1.1 Mandatory Modifiers (Forced Selection Before Add to Cart)

Mandatory modifiers (called "Forced Modifiers" in Restaurant Manager POS or "Required" in Toast) prevent order completion until a selection is made from the specified modifier group. This is essential for operational requirements such as cooking temperature for steaks, salad dressing choices, or pizza size selection.

The technical implementation involves setting `requiredMode` to `"REQUIRED"` (Toast) or configuring "Min Count" equal to "Max Count" equal to 1 (AmigoPOS), which triggers validation both at the user interface level (preventing the user from closing the modifier screen) and at the API level (rejecting orders that lack required modifiers).

Mandatory modifiers create friction in the ordering process but ensure data completeness for kitchen operations. Systems typically implement "auto-select" features for single-option mandatory modifiers to reduce user friction—if a modifier group has only one option and is mandatory, the system automatically selects it without user intervention.

#### 4.1.2 Optional Modifiers (Customer Discretion)

Optional modifiers provide flexibility without enforcing selection, allowing customers to customize orders only when desired. These are configured with `requiredMode` set to `"OPTIONAL"` (Toast) or min count set to 0 (AmigoPOS).

Optional modifiers can be further categorized as:

- **Visible optional**: Appearing automatically but allowing skip
- **Hidden optional**: Requiring the server to actively access the modifier screen

Toast's `"OPTIONAL_FORCE_SHOW"` mode prompts servers to view the modifier group without requiring selection, typically used for upselling opportunities like "Would you like to add a side?" Lightspeed's "Automatic Modifier Prompt" displays optional modifier groups without enforcing selection, balancing operational efficiency with upsell opportunities.

#### 4.1.3 Conditional Requirements (Size Must Be Selected First)

Conditional requirements create dynamic validation rules where the requirement of one modifier group depends on the selection in another. For example, selecting "Dipping Sauce" as an add-on might make "Sauce Type" (Ranch, BBQ, Honey Mustard) mandatory, while not selecting "Dipping Sauce" makes "Sauce Type" irrelevant and unavailable.

This requires dependency graphs between modifier groups, where groups have `parent_modifier_id` or `conditional_display_rules` that evaluate the state of other selections before determining visibility and requirement status. Implementation complexity increases significantly with conditional requirements, as the system must validate the dependency graph for circular references and ensure that changing a parent selection properly resets child selections that are no longer valid.

### 4.2 Selection Cardinality

#### 4.2.1 Single-Select Constraints (Choose One Crust Type)

Single-select constraints enforce that exactly one option must be chosen from a modifier group (or zero, if optional), preventing multiple selections. This is appropriate for mutually exclusive options such as:

- Pizza crust type (Thin, Regular, Deep Dish)
- Coffee size (Small, Medium, Large)
- Bread choice (White, Wheat, Rye)

Technically, this is implemented through `isMultiSelect: false` (Toast) or "Exclusive" checkbox (AmigoPOS), which automatically enforces `maxSelections: 1` and `allowsDuplicates: false`. The UI typically renders single-select groups as radio buttons or segmented controls rather than checkboxes, providing clear visual indication of the mutual exclusivity.

#### 4.2.2 Multi-Select with Minimum Limits (At Least 1 Topping)

Multi-select groups with minimum limits require customers to select at least a specified number of options from a group, commonly used for combo meals ("Choose at least 2 sides") or build-your-own pizzas ("Select at least 1 topping").

The `minSelections` field (Toast) or "Min Count" (AmigoPOS) defines this lower bound, with validation occurring when the user attempts to proceed or complete the order. Edge cases include handling scenarios where fewer options exist than the minimum required (which should disable the product or adjust the minimum) and providing clear user feedback about how many more selections are required.

#### 4.2.3 Multi-Select with Maximum Limits (Maximum 8 Toppings)

Multi-select with maximum limits prevents over-selection, such as limiting pizza toppings to 8 for operational reasons or restricting add-ons to reasonable quantities. The `maxSelections` field defines the upper bound, with the UI preventing additional selections once the limit is reached.

Advanced systems implement "smart replacement" where selecting a new option when at the maximum automatically deselects the oldest or least expensive selection, though this requires explicit user confirmation to prevent accidental changes. Maximum limits interact complexly with quantity modifiers—if "Double Pepperoni" counts as one selection but uses two portions, the system must determine whether it counts as 1 toward the limit of 8 toppings or 2.

### 4.3 Default Behaviors

#### 4.3.1 Pre-Selected Default Options (Whole Milk Default for Latte)

Pre-selected default options streamline the ordering process by automatically selecting commonly chosen options, which the customer can change if desired. For example, a "Cafe Latte" might default to "Whole Milk" in the Milk modifier group, or a "House Salad" might default to "Ranch" dressing.

Defaults reduce order entry time and errors but require careful handling of pricing and inventory. Lightspeed implements this through **Preselect Modifiers** that appear highlighted (typically in green) on POS modifier screens, allowing staff to remove unwanted defaults by tapping them twice or using "No" prefix buttons. In high-volume cafes, having "Hot" pre-selected for coffee drinks saves thousands of taps per day, with "Iced" requiring only one tap to change.

#### 4.3.2 Default Price Handling (Included vs Charged Defaults)

Default price handling creates complexity when defaults have associated costs. If "Extra Cheese" is a default modifier priced at $1.00, and `defaultOptionsChargePrice` is `"YES"`, the displayed base price should include this cost to avoid surprising customers with a higher price than listed.

However, if the customer removes the default "Extra Cheese", the price should remain the same (removing defaults never reduces price in Toast's model), creating a potential customer service issue if they expect the price to decrease. Substitution pricing requires `defaultOptionsChargePrice` to be set to `"NO"` to function correctly, as the credit system assumes default modifiers have intrinsic value even when not explicitly charged.

### 4.4 Conditional Logic and Dependencies

#### 4.4.1 Parent-Child Modifier Relationships (Dipping Sauce Selected → Sauce Options Appear)

Parent-child modifier relationships implement hierarchical selection flows where options in child groups only become available after selecting specific parent modifiers. For example, selecting "Side: Fries" might reveal "Fry Size" (Small, Medium, Large) and "Fry Seasoning" options, while selecting "Side: Salad" reveals "Dressing" and "Add Croutons" options.

This is implemented through nested modifier groups where modifier options have an associated `nested_modifier_group_id` that references the group to display when that option is selected. The system must handle cases where the user changes the parent selection (switching from Fries to Salad), which should clear any child selections made under the previous parent to prevent invalid combinations like "Fry Seasoning: Cajun" on a salad.

#### 4.4.2 Nested Modifier Groups (Burger → Add Fries → Select Fry Type)

Nested modifier groups can theoretically extend to arbitrary depths (Toast supports unlimited nesting), but practical limitations exist. Each level of nesting adds cognitive load to the ordering process and increases the complexity of order validation, pricing calculation, and kitchen display formatting.

Most POS systems recommend limiting nesting to **2-3 levels deep** (Product → Modifier Group → Nested Modifier Group) to maintain usability. Additionally, not all online ordering platforms support nested modifiers, requiring "flattening" of the menu structure for those channels, where "Small Fries", "Medium Fries", "Small Salad", "Medium Salad" become top-level options rather than hierarchical selections.

#### 4.4.3 Exclusion Rules (No Gluten-Free Option with Regular Bun)

Exclusion rules (also called "incompatible modifiers" or "mutual exclusions") prevent invalid combinations such as "Gluten-Free Bun" with "Regular Bun" or "No Cheese" with "Extra Cheese." These rules define pairs or groups of modifiers that cannot coexist on the same line item.

Implementation approaches include maintaining an `excluded_modifier_ids` array on modifier options or creating separate "modifier compatibility matrices" that define allowed and disallowed combinations. Exclusion rules must be evaluated both at selection time (preventing the user from adding an incompatible modifier) and at validation time (rejecting orders that somehow contain incompatible combinations, such as through API submissions).

---

## 5. Order Line Item Storage

### 5.1 Relational Database Schema

#### 5.1.1 Order Line Items Table (Base Product Reference)

The `order_line_items` table stores the base product reference, quantity, and calculated base price at the time of order. Critical fields include:

- `product_id` (foreign key to products)
- `product_name_snapshot` (denormalized name at order time)
- `base_unit_price` (price per unit)
- `quantity`
- `line_total`

The snapshot fields are essential because product names and prices change over time, but historical orders must maintain the context of what was actually ordered and charged. For multi-tenant SaaS systems, the table includes `tenant_id` for row-level security and `location_id` to support multi-store operations, with indexes on `order_id` and `created_at` supporting efficient retrieval of recent orders.

#### 5.1.2 Line Item Modifiers Junction Table (Selected Options)

The `line_item_modifiers` table creates many-to-many relationships between line items and the specific modifier options selected. This table includes:

- `line_item_id` (foreign key)
- `modifier_group_id`
- `modifier_option_id`
- `modifier_name_snapshot`
- `unit_price` (the price of this modifier at order time)
- `quantity` (how many times this modifier was applied, typically matching the line item quantity)
- `pre_modifier` (for storing prefix/suffix instructions like "NO" or "EXTRA")

The snapshot fields here are equally critical—if "Extra Cheese" was $0.50 when ordered but later changed to $0.75, the historical order must show $0.50 to maintain accurate financial records.

#### 5.1.3 Price Snapshot Storage (Historical Pricing at Time of Order)

Price snapshot storage extends beyond just storing the price to capturing the entire pricing context, including which pricing rules were active (size-based, sequence-based, substitution-based), what discounts were applied, and what the calculated total was for each component. This enables accurate reporting and dispute resolution.

For complex pricing scenarios like "First 3 toppings free", the system must store not just the final $0.00 price for the first three toppings, but the fact that they were counted against the free allowance, ensuring that if the order is edited later (removing one free topping and adding a new one), the pricing recalculates correctly. Implementation typically involves storing `original_price`, `discount_amount`, and `pricing_rule_applied` fields in the line item modifiers table.

### 5.2 JSON Representation Patterns

#### 5.2.1 Uber Eats API Structure (selected_modifier_groups with selected_items)

The Uber Eats API represents modifiers using a `selected_modifier_groups` array containing objects with `id`, `name`, and `selected_items` arrays. Each selected item includes `id`, `name`, `price`, and `quantity`. This structure supports nested modifiers through recursive `selected_modifier_groups` within selected items, though Uber Eats limits nesting depth for practical reasons.

The pattern emphasizes human-readable names alongside IDs to facilitate debugging and customer service, while maintaining strict ID references for processing. The API also includes `removed_items` arrays to track when default selections are explicitly removed by the customer, enabling accurate inventory and pricing calculations for substitution scenarios.

#### 5.2.2 Square API Structure (OrderLineItemModifier with catalog_object_id)

Square's API uses `OrderLineItemModifier` objects with `catalog_object_id` referencing the modifier definition, `uid` for the specific instance, `name` (snapshot), `base_price_money`, and `total_price_money`. Square's approach separates the catalog reference (what was theoretically ordered) from the pricing (what was actually charged), supporting scenarios where catalog prices change between menu display and order submission.

The `quantity` field allows for modifiers to be applied multiple times (e.g., "Extra Cheese" twice for double cheese), with `total_price_money` calculated as the product of base price, modifier quantity, and line item quantity.

#### 5.2.3 Nested Modifier Representation (Hierarchical Selections)

Nested Modifier Representation requires recursive JSON structures where a modifier object can contain its own modifiers array. Toast's API demonstrates this pattern with recursive `modifiers` arrays within modifier objects, allowing unlimited depth but requiring careful handling in deserialization to prevent stack overflow attacks or excessive memory consumption from maliciously deep nesting.

For API responses, this might appear as:

```json
{
  "guid": "selection-guid",
  "entityType": "MenuItemSelection",
  "item": {"guid": "burger-guid"},
  "quantity": 1,
  "modifiers": [
    {
      "guid": "side-guid",
      "item": {"guid": "fries-guid"},
      "modifiers": [
        {
          "guid": "size-guid",
          "item": {"guid": "large-fries-guid"}
        }
      ]
    }
  ]
}
```

### 5.3 Concrete Implementation Example

#### 5.3.1 Large Pizza Base Item Reference

Consider a "Large Pizza with Extra Cheese and Pepperoni" order. The base item references the product "Margherita Pizza" with a base price of $14.00. The "Large" size is either a variant (if treated as a distinct SKU) or a modifier in the "Size" group. For this example, we'll treat Size as a variant with a $4.00 upcharge, resulting in a base price of $18.00 before toppings.

#### 5.3.2 Size and Crust Selection Storage

The size selection ("Large") is stored in the `order_line_items` table with `variant_id` referencing the "Large" variant, `base_unit_price` set to $18.00 (base $14.00 + variant upcharge $4.00), and `quantity` set to 1. If crust type is a separate modifier (e.g., "Hand-Tossed"), it is stored in the `line_item_modifiers` table with `unit_price` $0.00 (included) or specific upcharge for premium crusts.

#### 5.3.3 Topping Modifiers with Quantity and Pricing

The toppings "Extra Cheese" ($1.50) and "Pepperoni" ($1.50) are stored as separate records in the `line_item_modifiers` table:

| line_item_id | modifier_group_id | modifier_option_id | modifier_name | unit_price | quantity | pre_modifier |
|--------------|-------------------|-------------------|---------------|------------|----------|--------------|
| 1 | 20 | 205 | Extra Cheese | 1.50 | 1 | "EXTRA" |
| 1 | 20 | 210 | Pepperoni | 1.50 | 1 | "ADD" |

If the pizza included "First 3 toppings free" logic, the `unit_price` for these toppings would be $0.00, with additional fields tracking that they consumed 2 of the 3 free allowances.

#### 5.3.4 Special Instructions and Allergen Notes

Special instructions ("Well done please") are stored in the `special_instructions` text field on the `order_line_items` table. Allergen information or dietary restrictions (e.g., "Gluten-Free preparation") might be stored as flags in a `dietary_flags` JSONB column or as specific modifiers in a "Allergen" group, depending on whether they affect inventory or kitchen routing.

**Complete JSON Representation:**

```json
{
  "line_item_id": 1,
  "product": {
    "id": 55,
    "name": "Margherita Pizza",
    "base_price": 14.00
  },
  "variant": {
    "id": 101,
    "name": "Large",
    "upcharge": 4.00
  },
  "selected_modifiers": [
    {
      "group_id": 20,
      "group_name": "Toppings",
      "selection_type": "multi",
      "pricing_rule": "first_3_free",
      "selected": [
        {
          "option_id": 205,
          "name": "Cheese",
          "pre_modifier": "EXTRA",
          "unit_price": 1.50,
          "included_in_base": false
        },
        {
          "option_id": 210,
          "name": "Pepperoni",
          "pre_modifier": "ADD",
          "unit_price": 0.00,
          "included_in_base": true
        }
      ]
    }
  ],
  "special_instructions": "Well done please",
  "calculated_total": 19.50
}
```

---

## 6. Common Pitfalls and Anti-Patterns

### 6.1 Data Modeling Mistakes

#### 6.1.1 Excessive Nesting Depth (Performance and UX Issues)

Excessive nesting depth creates usability nightmares and technical complexity. While Toast supports unlimited nesting and Otter supports multiple levels, practical implementations should rarely exceed **2-3 levels deep**.

Deep nesting:
- Slows down order entry as servers navigate through multiple screens
- Increases the likelihood of selection errors
- Complicates kitchen display formatting

From a technical perspective, recursive queries on deeply nested structures suffer from performance degradation, and JSON serialization/deserialization of deep trees consumes significant memory. Systems should implement hard limits on nesting depth (enforced at the API level) and provide "flattening" utilities for channels that don't support nesting.

#### 6.1.2 Duplicate Modifier Names Across Groups (Reporting Confusion)

Duplicate modifier names across groups cause reporting confusion and inventory inaccuracies. If "Extra Cheese" exists in both a "Pizza Toppings" group and a "Burger Add-ons" group as separate database records with separate IDs, reporting systems may aggregate them incorrectly or fail to distinguish between them.

Worse, if inventory tracking links "Extra Cheese" to a specific recipe, having multiple records creates ambiguity about which recipe to deplete. Best practices include maintaining a master modifier catalog with unique entries for each inventory-trackable item, then referencing these master entries from modifier groups rather than creating duplicate records.

#### 6.1.3 Missing Inventory Linkage (Untracked Consumption)

Missing inventory linkage results in untracked consumption and inaccurate cost of goods sold (COGS) calculations. Many POS implementations treat modifiers purely as pricing constructs without linking them to inventory items or recipes. This means that "Add Avocado" might generate revenue but never deplete avocado inventory, leading to stockouts and accounting discrepancies.

Restaurant365 emphasizes that modifiers should be treated as regular menu items for inventory purposes, with each modifier linked to a recipe defining ingredient portions. For modifiers that don't affect inventory (like "No Onions"), this linkage isn't necessary, but for any modifier that involves physical ingredients, inventory linkage is essential for accurate stock management and profitability analysis.

### 6.2 Scalability and Performance Issues

#### 6.2.1 JSON Query Performance Degradation at Scale

JSON query performance degradation occurs when modifier configurations are stored in JSONB columns and queried extensively for reporting or menu generation. While PostgreSQL's JSONB indexing supports simple containment queries (`@>`), complex aggregations or searches within JSON arrays become expensive as data volumes grow.

For example, finding all orders that included "Extra Cheese" modifiers requires scanning and parsing JSON for every line item, rather than a simple indexed join. Hybrid approaches that store critical filtering data (modifier IDs, pricing) in normalized columns while keeping display metadata in JSON provide better performance for operational queries while maintaining flexibility.

#### 6.2.2 Concurrent Menu Modification Race Conditions

Concurrent menu modification race conditions arise when multiple administrators edit modifier configurations simultaneously, or when menu updates occur while orders are being placed. If an administrator changes the price of "Extra Cheese" from $0.50 to $0.75 at the same moment a customer places an order, the system might charge the old price while displaying the new price, or vice versa.

Implementing versioning for modifier configurations (where changes create new versions rather than updating existing records) and snapshotting prices at the moment of order entry prevents these inconsistencies. However, versioning increases storage requirements and complicates the editing interface, requiring careful UX design to manage version visibility and activation.

#### 6.2.3 Denormalized Price Calculation Errors

Denormalized price calculation errors occur when systems store calculated totals without sufficient context to recalculate them correctly during order modifications. If a pizza order stores only the final price of $19.50 without breaking down size upcharge ($4.00), topping charges ($1.50 for extra cheese, $0 for pepperoni), and tax, then editing the order (removing pepperoni, adding mushrooms) requires complete recalculation.

Without knowing that pepperoni was free as part of a "3 toppings included" promotion, the system might incorrectly credit $1.50 for removing it, or fail to charge for mushrooms if the free allowance wasn't properly tracked. Storing detailed pricing context (which modifiers counted against which allowances, what pricing rules were applied) enables accurate recalculation.

### 6.3 Operational Complexity

#### 6.3.1 Kitchen Display System (KDS) Routing Confusion

Kitchen Display System (KDS) routing confusion happens when modifiers aren't properly tagged with preparation area information. If a "Grilled Chicken Caesar Salad" is routed to the salad station but the "Extra Chicken" modifier isn't tagged to also route to the grill station, the salad station receives an order for "Caesar Salad + Extra Chicken" but never receives the chicken from the grill.

Modifier groups and options should inherit preparation area tags from their parent products but allow overrides for specific scenarios. Additionally, pre-modifiers (like "NO" or "EXTRA") must be formatted clearly on KDS tickets to prevent misinterpretation—"NO Cheese" should be visually distinct from "Extra Cheese" to prevent kitchen errors.

#### 6.3.2 Menu Concatenation and Reporting Fragmentation

Menu concatenation and reporting fragmentation refers to the challenge of generating meaningful reports when modifiers create effectively unique menu items. Restaurant365 describes how "Cheeseburger - No Onions - Add Avocado - Extra Cheese" becomes a distinct line item in sales reports if menu concatenation is enabled, making it difficult to aggregate total cheeseburger sales across all variations.

Conversely, without concatenation, reports show "Cheeseburger" as a single item with separate modifier lines, losing the context of which specific combinations were popular. Systems should support both views: concatenated views for kitchen operations and inventory depletion, and aggregated views for business analysis. This requires maintaining both the atomic modifier selections and the ability to reconstruct the "effective item name" for different reporting contexts.

#### 6.3.3 Online vs In-Store Modifier Sync Issues

Online vs In-Store modifier sync issues arise when online ordering platforms support different modifier capabilities than the in-store POS. For example, Toast's pre-modifiers aren't supported in online ordering, meaning that "NO Onions" selected in-store (using the "NO" pre-modifier) might appear as just "Onions" online, or require creating separate "No Onions" modifier options specifically for online channels.

Nested modifiers face similar limitations—if the online platform doesn't support nesting, the menu must be flattened, creating "Small Fries", "Medium Fries", "Large Fries" as top-level options rather than "Fries" with a nested "Size" group. Maintaining menu parity across channels requires either limiting in-store capabilities to the lowest common denominator (reducing functionality) or maintaining channel-specific menu configurations (increasing administrative overhead).

---

## 7. Real-World Implementation Examples

### 7.1 Coffee Shop Operations

Coffee shops present a hybrid modifier/variant scenario involving size variants, milk alternatives, espresso shots, and flavor syrups, requiring careful handling of both variants (size) and modifiers (customizations).

**Size Variants:** Size (Small, Medium, Large) is typically treated as a product variant rather than a modifier, with distinct base prices ($3.50, $4.50, $5.50) and inventory implications (different cup sizes). These are stored as separate variant records with their own SKUs to track cup inventory depletion accurately.

**Milk Type Modifier Groups:** "Milk Options" (Whole, Skim, 2%, Almond, Oat, Soy) form a single-select required group with Whole Milk as the default. Almond and Oat milk typically carry $0.50-$1.00 surcharges, implemented through price adjustments on the modifier options. This group is usually global and shared across all espresso drinks.

**Extras Modifiers:** "Add Extra Shot" (+$0.80), "Add Syrup Pump" (+$0.50), "Add Whipped Cream" (+$0.25) form a multi-select optional group where customers can choose multiple enhancements. These require inventory tracking for espresso shot counts, syrup bottles, and whipped cream canisters, with quantity support for "Double Shot" or "3 Pumps Vanilla."

**Temperature and Special Instructions:** "Temperature" (Hot, Iced, Extra Hot) is often a single-select modifier affecting preparation method, while "Special Instructions" (free text fields) accommodate requests like "Stir well" or "Light ice." These require routing to specific preparation stations—iced drinks to the cold bar, hot drinks to the espresso machine.

### 7.2 Pizza Restaurant Operations

Pizza restaurants represent high complexity due to half-and-half configurations, topping distribution, and included topping thresholds.

**Size and Crust Selection:** Size (Small, Medium, Large, X-Large) is typically a variant with base price scaling, while Crust Type (Thin, Hand-Tossed, Thick, Stuffed, Gluten-Free) may be either a variant or a modifier depending on inventory tracking requirements. Gluten-Free crusts often require strict cross-contamination protocols and separate inventory tracking, favoring variant treatment.

**Topping Modifier Groups with Half/Whole Logic:** Toppings represent the primary complexity, requiring modifiers to specify application to "Whole," "Left Half," or "Right Half." This requires either separate modifier groups for each portion or a portion attribute (`enum: WHOLE, LEFT, RIGHT`) on the line item modifier record. Half toppings typically cost 50-60% of whole toppings, requiring the pricing engine to apply portion multipliers.

**Included Topping Thresholds:** "Build Your Own Pizza" promotions often include the first 3 toppings in the base price, charging $0.50 for each additional topping. This requires the `included_quantity` field on the product-modifier group relationship and counting logic during cart calculation. Premium toppings (artichokes, anchovies) may count as 2 regular toppings against the free allowance, requiring `tier_value` fields on modifier options.

**Specialty Pizza Pre-Configurations:** Pre-defined pizzas (like "Supreme") use default modifiers (pepperoni, mushrooms, peppers) that appear pre-selected when the item is added to the cart. Customers can remove unwanted defaults (tracked in `removed_items` arrays) or add additional toppings, with the pricing engine calculating the net difference between included and additional selections.

### 7.3 Burger Joint Operations

Burger modifiers focus on cooking precision, premium add-ons, and substitution modifiers, with particular attention to kitchen communication.

**Patty Count Variants:** Single, Double, and Triple patties are typically product variants with distinct inventory SKUs and significantly different base prices, rather than modifiers. This ensures accurate meat inventory tracking and different cooking times.

**Cooking Temperature Modifiers:** "Cooking Preference" (Rare, Medium Rare, Medium, Medium Well, Well Done) is a single-select required group applicable to beef items. This is often a global shared group with "Medium" as the default. The modifier routes to the grill station and affects cooking time calculations—Rare burgers take 3-4 minutes while Well Done requires 6-8 minutes.

**Premium Add-On Modifiers:** "Add Bacon" (+$2.00), "Add Avocado" (+$1.50), "Extra Cheese" (+$0.75), "Fried Egg" (+$1.25) form a multi-select optional group. These require specific inventory tracking for perishable ingredients and often have limited availability (bacon may run out before close). Nested modifiers may apply here: selecting "Add Fries" reveals "Fry Type" options (Regular, Sweet Potato, Cheese Fries).

**Bun Type and Condiment Modifications:** "Bun Type" (Regular, Whole Wheat, Gluten-Free, Lettuce Wrap) may incur surcharges for premium options, while "Condiments" (No Mayo, Extra Mustard, Sauce on Side) are typically no-charge modifications that require precise kitchen communication to prevent remakes. Pre-modifiers (No, Extra, Side) are particularly useful here to avoid creating separate SKUs for "Tomato" and "No Tomato."

### 7.4 Fine Dining Operations

Fine dining modifier systems emphasize preparation precision, allergen safety, and service timing rather than simple add-ons.

**Preparation Preference Modifiers:** "Cooking Temperature" (Rare, Medium Rare, Medium) for steaks and fish requires precise timing and temperature control, often with specific degree ranges (Rare: 120-125°F, Medium Rare: 130-135°F). "Sauce on Side," "Dressing on Side," and "Light Seasoning" are common no-charge modifiers that require specific plating instructions and routing to the expeditor.

**Allergen and Dietary Restriction Handling:** Fine dining systems must accommodate severe allergies through explicit modifier flags and kitchen alerts. The structure includes:

- `allergies` arrays with severity levels (mild, critical) and sources
- `dietary_restrictions` arrays (Gluten-Free, Vegan, Nut-Free)
- `preparation_instructions` fields specifying cross-contamination avoidance protocols

These modifiers often trigger KDS alerts (red text, audible notifications) to ensure kitchen staff take appropriate precautions.

**Course Timing Modifiers:** "Fire/Hold" instructions control when items enter preparation—"Fire" indicates immediate preparation while "Hold" delays cooking until the server confirms. "Course Sequencing" (First Course, Second Course, Cheese Course, Dessert) ensures proper pacing of multi-course meals, with modifiers routing items to specific course queues in the kitchen. These require temporal logic in the KDS to display items only when appropriate based on table progress.

**Wine Pairing and Substitution Modifiers:** Wine pairings may be offered as modifiers to tasting menus, with options for "Standard Pairing," "Premium Pairing," or "Non-Alcoholic Pairing." Substitution modifiers allow swapping menu components—such as substituting a vegetarian entrée for the meat course—with upcharges or credits calculated accordingly. These require sophisticated pricing logic to handle the difference between the standard inclusion and the selected alternative, often using Toast's substitution pricing model.
