# Combo Implementation: Product vs Discount Approach

## The Core Problem

We need to support restaurant combos (e.g., "Burger + Fries + Drink = €12"). There are two architectural approaches, each with distinct trade-offs.

---

## Approach 1: Product-Based Combos (via Modifiers)

### What It Is
Combos are actual menu products with modifier groups that let customers select options.

### Schema
```typescript
// Combo is a product
product {
  name: "Burger Combo"
  basePrice: 1200  // €12
  // Time-based fields (optional)
  validFrom: timestamp
  validUntil: timestamp
  activeDaysOfWeek: integer[]
  startTime: time
  endTime: time
}

// Customer selections
modifierGroup {
  name: "Choose Your Burger"
  minSelections: 1
  maxSelections: 1
}

modifier {
  name: "Classic Burger"
  basePrice: 0  // Included
  referencedProductId: uuid  // Links to actual burger product
}
```

### Customer Experience
1. Customer sees "Burger Combo - €12" on menu
2. Orders combo product
3. Selects options interactively (burger type, fries type, drink)
4. Pays €12 + any premium upgrades

### What Customer Adds Items Separately
```
Customer adds:
- Classic Burger (€10)
- Fries (€3)
- Cola (€2)
Total: €15  ❌ No discount

Staff must suggest: "Order the Burger Combo for €12 instead!"
```

### Pros
- ✅ **Visible on menu** - Customers see and order combos
- ✅ **Interactive selection** - Clear UI for choosing options
- ✅ **Simple setup** - Create product + modifier groups
- ✅ **Time-based** - Can restrict by date/time using product fields
- ✅ **Clear reporting** - "Sold 450 Burger Combos"
- ✅ **Upselling** - Easy to show premium upgrades
- ✅ **Customer education** - Customers learn your combo offerings
- ✅ **Better margins** - Some customers pay full price for separate items

### Cons
- ❌ **No auto-discount** - Customer MUST order combo product to get combo price
- ❌ **Menu changes** - Temporary combos require enabling/disabling products

### Use Cases
- Permanent combos: "Family Meal Deal - €35"
- Regular offerings: "Build Your Own Combo"
- Time-restricted combos with product time fields: "Weekend Brunch - €15 (Sat-Sun only)"

---

## Approach 2: Discount-Based Combos

### What It Is
Combos are discount offers that auto-apply when specific items are in the cart.

### Schema (Complex)
```typescript
// The discount
offer {
  name: "Burger Combo Auto-Discount"
  discountType: "combo"
  comboPrice: 1200  // €12 total for all items
  autoApply: true
  validFrom: timestamp
  validUntil: timestamp
  activeDaysOfWeek: integer[]
  startTime: time
  endTime: time
}

// Requirement groups (ALL must be satisfied)
offerRequirementGroup {
  offerId: uuid
  name: "Burgers"
  minQuantity: 1  // Must have 1 burger
  maxQuantity: 1  // Only 1 counts toward combo
}

offerRequirementGroup {
  offerId: uuid
  name: "Sides"
  minQuantity: 1
  maxQuantity: 1
}

offerRequirementGroup {
  offerId: uuid
  name: "Drinks"
  minQuantity: 1
  maxQuantity: 1
}

// Products in each group
offerRequirementGroupProduct {
  requirementGroupId: uuid
  productId: uuid  // Classic Burger, Cheese Burger, etc.
}
```

### Customer Experience
1. Customer does NOT see combo on menu
2. Adds items separately:
   - Classic Burger (€10)
   - Fries (€3)
   - Cola (€2)
3. System detects all required items present
4. Auto-applies discount: "Burger Combo Deal -€3"
5. Total: €12

### What Happens
```
Cart before discount: €15
Auto-discount applies: -€3
Final total: €12 ✅
```

### Pros
- ✅ **Auto-discount** - Works even if customer adds items separately
- ✅ **No menu changes** - Create/disable without touching menu
- ✅ **Marketing flexibility** - Easy to schedule promotions
- ✅ **Hidden savings** - Customer discovers deal at checkout

### Cons
- ❌ **Invisible on menu** - Customer doesn't know combo exists
- ❌ **Complex setup** - Requires offer + groups + product links
- ❌ **Complex validation** - Must check all groups satisfied
- ❌ **Customer confusion** - "Why did my total change?"
- ❌ **Difficult reporting** - Need joins across multiple tables
- ❌ **No interactive selection** - Can't guide customer through choices
- ❌ **Edge case complexity** - What if customer adds 3 burgers? Modified burger? Etc.

### Setup Complexity
**Per combo:**
1. Create offer (1 step)
2. Create requirement group for burgers (1 step)
3. Add all burger products to group (N steps)
4. Create requirement group for sides (1 step)
5. Add all side products to group (N steps)
6. Create requirement group for drinks (1 step)
7. Add all drink products to group (N steps)

**Total: 6 + (3×N) steps** vs **product combo: 3 + N steps**

### Use Cases
- **Flash sales**: "This Friday only: 2 pizzas + 2 drinks = €20"
- **Mix & match**: "Any 3 appetizers = €15"
- **Conditional deals**: "Spend €30 on entrees, get 2 sides for €5"
- **Rotating weekly promos**: Different cross-sell each week
- **Membership exclusives**: VIP-only combo pricing

---

## The Key Question

### What's the ONLY difference that matters?

**Auto-discount when items added separately.**

Both approaches can:
- ✅ Have time-based restrictions
- ✅ Support temporary or permanent combos
- ✅ Track inventory via referenced products
- ✅ Handle pricing and upgrades

**Product combos CANNOT:**
- ❌ Auto-apply discount when customer adds items separately

**That's it. That's the ONLY functional difference.**

---

## Recommended Approach

### Start Simple: Product Combos Only

**Add time fields to product table:**
```typescript
product {
  // ... existing fields
  validFrom: timestamp
  validUntil: timestamp  
  activeDaysOfWeek: integer[]
  startTime: time
  endTime: time
}
```

**This gives you:**
- ✅ Permanent combos
- ✅ Time-restricted combos  
- ✅ Interactive customer selection
- ✅ Menu visibility
- ✅ Simple setup and maintenance

**You DON'T get:**
- ❌ Auto-discount when items added separately

### Add Discount Combos Later (If Needed)

**Only implement when:**
- Merchant specifically requests auto-apply functionality
- You have concrete use cases for the scenarios listed above
- You're ready to handle the additional complexity

**Don't build it preemptively!**

### Hybrid Approach (Advanced)

For **each combo**, create BOTH:

1. **Product combo** (visible on menu, interactive selection)
2. **Matching discount combo** (auto-applies if items added separately)

**Example:**
- Product: "Burger Combo - €12" (menu item)
- Discount: "Burger Combo Auto-Discount" (auto-applies to burger + fries + cola)
- Link them to prevent double-discounting

**Benefit:** Customer gets combo price either way (order combo OR add separately)

**Cost:** 2× setup complexity, 2× maintenance, more edge cases

---

## Real-World Examples

### McDonald's
- **Menu:** Combo products (Big Mac Meal, etc.)
- **NO auto-discount** if you order Big Mac + Fries + Drink separately
- **Why:** Better margins, customer education, menu clarity

### Subway
- **Menu:** Individual items
- **Auto-discount at POS:** "Sub + Chips + Drink = $6.99"
- **Why:** Simple items, consistent combo structure

### Domino's
- **Menu:** Individual pizzas
- **App:** "Mix & Match: Any 2 for $5.99 each"
- **Auto-applies in app**
- **Why:** Marketing tool, drives app usage, temporary promos

**All three are successful. Different approaches for different business models.**

---

## Decision Framework

**Ask yourself:**

1. **Is it critical that customers get combo pricing even when they add items separately?**
   - NO → Product combos only ✅
   - YES → Need discount combos

2. **Will you run frequent temporary cross-sell promotions?**
   - NO → Product combos only ✅
   - YES → Consider discount combos

3. **Do you need "invisible" deals that surprise customers at checkout?**
   - NO → Product combos only ✅
   - YES → Consider discount combos

4. **Are you willing to manage 2× the complexity for auto-discount?**
   - NO → Product combos only ✅
   - YES → Implement both systems

**For 90% of restaurants: Product combos only is the right answer.**

---

## Summary

**Product Combos:**
- Simple, visible, educational
- Customer must order combo product
- Best for permanent/regular offerings

**Discount Combos:**
- Complex, hidden, automatic
- Works however customer adds items
- Best for temporary promotions

**The trade-off:**
- **Simplicity vs Auto-discount**

**Recommended:** Start with product combos + time fields. Add discount combos later only if business needs demand it.

---

## Implementation Status

**Currently have:**
- ✅ Product schema
- ✅ Modifier schema with `referencedProductId`
- ✅ Offer schema (basic discounts)

**Need to add for product combos:**
- ⚠️ Time fields on product table (validFrom, validUntil, activeDaysOfWeek, startTime, endTime)

**Need to add for discount combos:**
- ⚠️ `autoApply` field on offer table
- ⚠️ `comboPrice` field on offer table
- ⚠️ `offerRequirementGroup` table
- ⚠️ `offerRequirementGroupProduct` table
- ⚠️ Complex validation logic for group satisfaction
- ⚠️ Double-discount prevention logic

**Recommendation:** Add time fields to product table now. Ship with product combos. Gather merchant feedback. Add discount combo system later if needed.
