function applyBOGO(orderItems: OrderItem[], discount: Discount) {
  // 1. Filter only items that qualify
  const qualifyingItems = orderItems.filter(item =>
    discount.menuItemIds.includes(item.menuItemId)
  );

  // 2. Must have at least 2 items
  if (qualifyingItems.length < 2) {
    return; // BOGO doesn't apply
  }

  // 3. Sort by price (most expensive first)
  qualifyingItems.sort((a, b) => b.price - a.price);

  // 4. Apply discount to every OTHER item (2nd, 4th, 6th...)
  for (let i = 1; i < qualifyingItems.length; i += 2) {
    const discountAmount = qualifyingItems[i].price * (discount.bogoPercent / 100);
    applyDiscount(qualifyingItems[i], discountAmount);
  }
}
```

**Key points:**
- Takes the **most expensive** item at full price
- Discounts the **next most expensive** (2nd item)
- If 3 items: 1st full price, 2nd discounted, 3rd full price
- If 4 items: 1st full price, 2nd discounted, 3rd full price, 4th discounted

---

## **Real Examples**

### **Example 1: Different Prices**

**BOGO 50% on burgers:**
- Customer orders:
  - Premium Burger: €15
  - Classic Burger: €10

**Result:**
- Premium (most expensive): €15 (full price)
- Classic (2nd): €10 → €5 (50% off)
- **Total: €20**

**Why this order?** Keeps highest-value item at full price (better for merchant)

---

### **Example 2: Three Items**

**BOGO 100% (free) on coffee:**
- Customer orders:
  - Latte: €4
  - Cappuccino: €4
  - Espresso: €3

**Result:**
- Latte: €4 (full price, 1st item)
- Cappuccino: €4 → €0 (free, 2nd item)
- Espresso: €3 (full price, 3rd item)
- **Total: €7**

**Pattern:** Every other item is discounted

---

### **Example 3: Four Items**

**BOGO 50% on wings:**
- Customer orders 4× Buffalo Wings (@€8 each)

**Result:**
- Wings #1: €8 (full)
- Wings #2: €8 → €4 (50% off)
- Wings #3: €8 (full)
- Wings #4: €8 → €4 (50% off)
- **Total: €24** (instead of €32)

---

## **Why Toast Limits BOGO to Same Item**

### **Reason 1: Simplicity**

**Same item BOGO:**
```
If (item count ≥ 2) → discount every 2nd item
```
Simple logic, easy to understand.

**Cross-product BOGO:**
```
If (has pizza AND has drink) → discount drink
But which drink? What if multiple?
What if drink costs more than discount allows?
```
Gets complex fast.

---

### **Reason 2: Merchant Understanding**

Restaurant owners understand:
- ✅ "Buy one burger, get one burger half off"
- ❌ "Buy burger, get drink free up to $3 with minimum $10 order..."

Toast keeps it simple so merchants don't make mistakes.

---

### **Reason 3: Rare Use Case**

**Common:** "BOGO burgers" (same item)

**Rare:** "Buy burger get fries free" (different items)

Most merchants want same-item BOGO. Cross-product is edge case.

---

### **Reason 4: Combo Products Handle It Better**

For "burger + fries" deals, Toast recommends:
```
Menu Item: "Burger + Fries Combo"
Price: $12 (instead of $15 separate)
