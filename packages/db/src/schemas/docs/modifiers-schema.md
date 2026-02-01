# Modifier Dependencies System

## Overview

The modifier dependencies system enables complex product customization flows where options can affect each other's **price** and **visibility**.

> **Note:** The examples in this document are real-world data extracted from [efood.gr](https://www.efood.gr), a major food delivery platform in Greece.

---

## Core Concept

Each row answers: **"When [dependsOnModifierId] is selected, how does it affect [modifierId]?"**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ USE CASE 1: DYNAMIC PRICING                                             │
└─────────────────────────────────────────────────────────────────────────┘

When a modifier's price varies based on another selection.

  Size (Group)          Variety (Group)
  ┌─────────────┐       ┌─────────────────────────────────┐
  │ ○ Regular   │──────▶│ Costa Rica                      │
  │ ○ XLarge    │──────▶│   Regular selected → €2.80      │
  └─────────────┘       │   XLarge selected  → €3.80      │
                        └─────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ USE CASE 2: CONDITIONAL VISIBILITY                                      │
└─────────────────────────────────────────────────────────────────────────┘

When a modifier should only appear based on another selection.

  Sugar Level (Group)     Sugar Type (Group)
  ┌─────────────────┐     ┌──────────────────────────────┐
  │ ○ Sweet         │────▶│ White Sugar  (enabled: true) │
  │ ○ Medium        │────▶│ Brown Sugar  (enabled: true) │
  │ ○ None ─────────│────▶│ Stevia       (enabled: true) │
  └─────────────────┘     │                              │
         │                │ When "None" selected:        │
         └───────────────▶│ ALL options  (enabled: false)│
                          └──────────────────────────────┘
```

---

## Example 1: Pita/Gyro Order (Conditional Visibility)

> Source: efood.gr - Greek Souvlaki Restaurant

```
┌─────────────────────────────────────────────────────────────────────┐
│ TIER 1: Pita Type (radio, pick 1)  - NO DEPENDENCIES                │
├─────────────────────────────────────────────────────────────────────┤
│  • Παραδοσιακή πίτα (Traditional)    €4.10                          │
│  • Διπλή πίτα (Double)               €4.70                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ TIER 2: Choose Style (radio, pick 1)  - NO DEPENDENCIES             │
├─────────────────────────────────────────────────────────────────────┤
│  • Απ'όλα (Everything - tomato & onion)  ───────┐                   │
│  • ή επιλέξτε υλικά (Select ingredients) ───┐   │                   │
└─────────────────────────────────────────────┼───┼───────────────────┘
                                              │   │
                           ┌──────────────────┘   │
                           │                      │
                           ▼                      ▼
              ┌────────────────────┐   ┌────────────────────┐
              │ Ingredients:       │   │ Ingredients:       │
              │ ☑ VISIBLE          │   │ ☐ HIDDEN           │
              │                    │   │                    │
              │ Customer picks     │   │ Customer gets      │
              │ what they want     │   │ default combo      │
              └────────────────────┘   └────────────────────┘
```

**In plain English:**
> "When customer selects 'Everything', hide the ingredients list (they get the default). When customer selects 'Select ingredients', show the list so they can customize."

### Database Rows

```
┌────────────────┬──────────────────────────┬───────┬─────────┐
│ modifierId     │ dependsOnModifierId      │ price │ enabled │
├────────────────┼──────────────────────────┼───────┼─────────┤
│ potatoes       │ 32.89 (All/Everything)   │ 0.00  │ false   │ ← hidden
│ potatoes       │ 32.90 (Select)           │ 0.00  │ true    │ ← visible
│ tomato         │ 32.89 (All/Everything)   │ 0.00  │ false   │ ← hidden
│ tomato         │ 32.90 (Select)           │ 0.00  │ true    │ ← visible
│ onion          │ 32.89 (All/Everything)   │ 0.00  │ false   │ ← hidden
│ onion          │ 32.90 (Select)           │ 0.00  │ true    │ ← visible
│ ...            │ ...                      │ ...   │ ...     │
└────────────────┴──────────────────────────┴───────┴─────────┘
```

---

## Example 2: Coffee Order (Dynamic Pricing + Visibility)

> Source: efood.gr - Greek Coffee Shop

### Price Depends on Size

```
┌─────────────────────────────────────────────────────────────────────┐
│ TIER 1: Size (radio, pick 1)                                        │
├─────────────────────────────────────────────────────────────────────┤
│  • Regular                                                          │
│  • XLarge (4 espresso shots)                                        │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ ↓ PRICE DEPENDS ON SIZE
┌──────────────────────────▼──────────────────────────────────────────┐
│ TIER 2: Coffee Variety (radio, pick 1)                              │
├─────────────────────────────────────────────────────────────────────┤
│  Option              │ Regular Price │ XLarge Price                 │
│  ────────────────────┼───────────────┼──────────────                │
│  Blend Arabica       │    €2.40      │    €3.40                     │
│  Costa Rica          │    €2.80      │    €3.80                     │
│  Ethiopia            │    €2.80      │    €3.80                     │
│  Guatemala           │    €2.80      │    €3.80                     │
│  Colombia            │    €2.80      │    €3.80                     │
│  Brazil              │    €2.80      │    €3.80                     │
│  El Salvador         │    €2.80      │    €3.80                     │
│  Decaffeine          │    €2.40      │    €3.40                     │
└─────────────────────────────────────────────────────────────────────┘
```

**In plain English:**
> "When customer selects Costa Rica coffee, look at what SIZE they picked. If Regular → €2.80. If XLarge → €3.80"

### Visibility Depends on Sugar Level

```
┌─────────────────────────────────────────────────────────────────────┐
│ TIER 3: Sugar Level (radio, pick 1)                                 │
├─────────────────────────────────────────────────────────────────────┤
│  • Very sweet                                                       │
│  • Sweet                                                            │
│  • Medium-sweet                                                     │
│  • Medium                                                           │
│  • Little                                                           │
│  • None (Σκέτος)  ─────────────────┐                                │
└──────────────────────────┬─────────┼────────────────────────────────┘
                           │         │ ↓ DISABLED if "None"
┌──────────────────────────▼─────────▼────────────────────────────────┐
│ TIER 4: Sugar Type (checkbox, pick 0-1)                             │
├─────────────────────────────────────────────────────────────────────┤
│  • White sugar      (enabled: all EXCEPT "None")                    │
│  • Brown sugar      (enabled: all EXCEPT "None")                    │
│  • Saccharin        (enabled: all EXCEPT "None")                    │
│  • Stevia           (enabled: all EXCEPT "None")                    │
└─────────────────────────────────────────────────────────────────────┘
```

**In plain English:**
> "Sugar Type options should be DISABLED when customer selects 'None' for sugar level (because why pick a sugar type if you don't want sugar?)"

### No Dependencies (Always Visible, Fixed Prices)

```
┌─────────────────────────────────────────────────────────────────────┐
│ TIER 5: Add Milk (checkbox, unlimited)  - NO DEPENDENCIES           │
├─────────────────────────────────────────────────────────────────────┤
│  • Fresh milk (little)     €0.00                                    │
│  • Fresh milk (lots)       €0.30                                    │
│  • Almond milk             €0.50                                    │
│  • Oat milk                €0.50                                    │
│  • Soy milk                €0.50                                    │
│  • Coconut milk            €0.50                                    │
│  • Lactose-free            €0.50                                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ TIER 6: Add Extras (checkbox, unlimited)  - NO DEPENDENCIES         │
├─────────────────────────────────────────────────────────────────────┤
│  • Caramel syrup           €0.50                                    │
│  • Hazelnut syrup          €0.50                                    │
│  • Vanilla syrup           €0.50                                    │
│  • Whipped cream           €0.50                                    │
│  • Cinnamon                €0.00                                    │
│  • Extra double espresso   €1.00                                    │
└─────────────────────────────────────────────────────────────────────┘

     ↑ Always available
     ↑ Fixed price  
     ↑ No parent affects them
```

---

## Visual Flow of the Whole System

```
┌──────────────┐
│  1. SIZE     │
│  (Required)  │
└──────┬───────┘
       │ selected size code passed down
       ▼
┌──────────────┐
│  2. VARIETY  │ ← Uses size code to determine PRICE
│  (Required)  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  3. SUGAR    │
│    LEVEL     │
└──────┬───────┘
       │ selected sugar level code passed down
       ▼
┌──────────────┐
│  4. SUGAR    │ ← Uses sugar level to determine ENABLED/DISABLED
│    TYPE      │   (disabled if "None" selected above)
└──────────────┘

┌──────────────┐
│  5. MILK     │ ← Independent (no dependencies)
└──────────────┘

┌──────────────┐
│  6. EXTRAS   │ ← Independent (no dependencies)
└──────────────┘
```

---

## Key Dependency Patterns

**Pattern 1: Price varies by parent selection**
```
Size → Variety
       └── If Regular selected  → show price A
       └── If XLarge selected   → show price B
```

**Pattern 2: Option enabled/disabled by parent**
```
Sugar Level → Sugar Type
              └── If "None" selected → DISABLE all sugar types
              └── If anything else   → ENABLE all sugar types
```

**Pattern 3: No dependencies**
```
Milk options and Extras are independent - always available, fixed prices
```

---

## Database Schema Reference

```
┌──────────────────┐
│     products     │
└────────┬─────────┘
         │ 1:N
         ▼
┌──────────────────┐
│  modifierGroups  │
│──────────────────│
│ selectionType    │  ← 'single' (radio) or 'multiple' (checkbox)
│ isRequired       │
│ minSelections    │
│ maxSelections    │
└────────┬─────────┘
         │ 1:N
         ▼
┌──────────────────┐       ┌─────────────────────────────────┐
│    modifiers     │──────▶│  modifierOptionDependencies     │
│──────────────────│  1:N  │─────────────────────────────────│
│ priceAdjustment  │       │ modifierId                      │
│ isDefault        │       │ dependsOnModifierId             │
└──────────────────┘       │ price                           │
                           │ enabled                         │
                           └─────────────────────────────────┘
```

---

## Key Rules

1. **No dependencies** = modifier is always visible, uses default `priceAdjustment`

2. **Has dependencies** = find the row where `dependsOnModifierId` matches a selected modifier

3. **Group visibility** = derived from modifiers; group is visible if ANY modifier is enabled

4. **OR logic** = if multiple dependencies could match, the first match wins

5. **Price override** = dependency `price` completely replaces `priceAdjustment`, not added to it

---

## Raw Data

### Example 1: Pita Gyros (from efood.gr)

```json
{
  "tiers": [
    {
      "type": "radio",
      "name": "Επιλέξτε πίτα",
      "options": [
        { "name": "Παραδοσιακή πίτα", "code": "2737.10546", "dependencies": [], "price": 4.1 },
        { "name": "Διπλή πίτα", "code": "2737.10547", "dependencies": [], "price": 4.7 }
      ],
      "dependent_options": [],
      "order": 2,
      "code": 2737,
      "maximum_selections": 1
    },
    {
      "type": "radio",
      "name": "Επιλέξτε",
      "options": [
        { "name": "Απ`όλα(ντομάτα & κρεμμύδι)", "code": "32.89", "dependencies": [], "price": 0 },
        { "name": "ή επιλέξτε υλικά", "code": "32.90", "dependencies": [], "price": 0 }
      ],
      "dependent_options": [],
      "order": 3,
      "code": 32,
      "maximum_selections": 1
    },
    {
      "type": "checkbox",
      "name": "Υλικά",
      "options": [
        {
          "name": "Πατάτες",
          "code": "33.91",
          "dependencies": [
            { "code": "32.89", "price": 0, "enabled": false },
            { "code": "32.90", "price": 0, "enabled": true }
          ],
          "price": 0
        },
        {
          "name": "Ντομάτα",
          "code": "33.92",
          "dependencies": [
            { "code": "32.89", "price": 0, "enabled": false },
            { "code": "32.90", "price": 0, "enabled": true }
          ],
          "price": 0
        },
        {
          "name": "Κρεμμύδι",
          "code": "33.93",
          "dependencies": [
            { "code": "32.89", "price": 0, "enabled": false },
            { "code": "32.90", "price": 0, "enabled": true }
          ],
          "price": 0
        },
        {
          "name": "Γιαούρτι",
          "code": "33.94",
          "dependencies": [
            { "code": "32.89", "price": 0, "enabled": false },
            { "code": "32.90", "price": 0, "enabled": true }
          ],
          "price": 0
        },
        {
          "name": "Τζατζίκι",
          "code": "33.97",
          "dependencies": [
            { "code": "32.89", "price": 0, "enabled": false },
            { "code": "32.90", "price": 0, "enabled": true }
          ],
          "price": 0
        },
        {
          "name": "Ketchup",
          "code": "33.98",
          "dependencies": [
            { "code": "32.89", "price": 0, "enabled": false },
            { "code": "32.90", "price": 0, "enabled": true }
          ],
          "price": 0
        },
        {
          "name": "Μουστάρδα",
          "code": "33.99",
          "dependencies": [
            { "code": "32.89", "price": 0, "enabled": false },
            { "code": "32.90", "price": 0, "enabled": true }
          ],
          "price": 0
        }
      ],
      "dependent_options": ["32.90"],
      "order": 4,
      "code": 33,
      "maximum_selections": 0
    }
  ]
}
```

### Example 2: Coffee Order (from efood.gr)

```json
{
  "tiers": [
    {
      "type": "radio",
      "name": "Επιλέξτε μέγεθος",
      "options": [
        { "name": "Regular", "code": "36097.236087", "dependencies": [], "price": 0 },
        { "name": "XLarge(με 4 δόσεις espresso)", "code": "36097.236088", "dependencies": [], "price": 0 }
      ],
      "dependent_options": [],
      "order": 1,
      "code": 36097,
      "maximum_selections": 1
    },
    {
      "type": "radio",
      "name": "Επιλέξτε ποικιλία",
      "options": [
        {
          "name": "Blend 100% Arabica Il Toto",
          "code": "36098.236089",
          "dependencies": [
            { "code": "36097.236087", "price": 2.4, "enabled": true },
            { "code": "36097.236088", "price": 3.4, "enabled": true }
          ],
          "price": 0
        },
        {
          "name": "Costa Rica",
          "code": "36098.236090",
          "dependencies": [
            { "code": "36097.236087", "price": 2.8, "enabled": true },
            { "code": "36097.236088", "price": 3.8, "enabled": true }
          ],
          "price": 0
        },
        {
          "name": "Ethiopia",
          "code": "36098.236091",
          "dependencies": [
            { "code": "36097.236087", "price": 2.8, "enabled": true },
            { "code": "36097.236088", "price": 3.8, "enabled": true }
          ],
          "price": 0
        },
        {
          "name": "Decaffeine",
          "code": "36098.236096",
          "dependencies": [
            { "code": "36097.236087", "price": 2.4, "enabled": true },
            { "code": "36097.236088", "price": 3.4, "enabled": true }
          ],
          "price": 0
        }
      ],
      "dependent_options": ["36097.236087", "36097.236088"],
      "order": 2,
      "code": 36098,
      "maximum_selections": 1
    },
    {
      "type": "radio",
      "name": "Επιλέξτε ζάχαρη",
      "options": [
        { "name": "Πολύ γλυκός", "code": "36099.236097", "dependencies": [], "price": 0 },
        { "name": "Γλυκός", "code": "36099.236098", "dependencies": [], "price": 0 },
        { "name": "Μέτριος", "code": "36099.236100", "dependencies": [], "price": 0 },
        { "name": "Με ολίγη", "code": "36099.236101", "dependencies": [], "price": 0 },
        { "name": "Σκέτος", "code": "36099.236102", "dependencies": [], "price": 0 }
      ],
      "dependent_options": [],
      "order": 2057,
      "code": 36099,
      "maximum_selections": 1
    },
    {
      "type": "checkbox",
      "name": "Επιλέξτε είδος ζάχαρης",
      "options": [
        {
          "name": "Λευκή ζάχαρη",
          "code": "36100.236103",
          "dependencies": [
            { "code": "36099.236097", "price": 0, "enabled": true },
            { "code": "36099.236098", "price": 0, "enabled": true },
            { "code": "36099.236100", "price": 0, "enabled": true },
            { "code": "36099.236101", "price": 0, "enabled": true },
            { "code": "36099.236102", "price": 0, "enabled": false }
          ],
          "price": 0
        },
        {
          "name": "Καστανή ζάχαρη",
          "code": "36100.236104",
          "dependencies": [
            { "code": "36099.236097", "price": 0, "enabled": true },
            { "code": "36099.236098", "price": 0, "enabled": true },
            { "code": "36099.236100", "price": 0, "enabled": true },
            { "code": "36099.236101", "price": 0, "enabled": true },
            { "code": "36099.236102", "price": 0, "enabled": false }
          ],
          "price": 0
        },
        {
          "name": "Stevia",
          "code": "36100.236106",
          "dependencies": [
            { "code": "36099.236097", "price": 0, "enabled": true },
            { "code": "36099.236098", "price": 0, "enabled": true },
            { "code": "36099.236100", "price": 0, "enabled": true },
            { "code": "36099.236101", "price": 0, "enabled": true },
            { "code": "36099.236102", "price": 0, "enabled": false }
          ],
          "price": 0
        }
      ],
      "dependent_options": ["36099.236097", "36099.236098", "36099.236100", "36099.236101"],
      "order": 2058,
      "code": 36100,
      "maximum_selections": 1
    },
    {
      "type": "checkbox",
      "name": "Προσθέστε",
      "options": [
        { "name": "Γάλα φρέσκο λίγο", "code": "36101.236108", "dependencies": [], "price": 0 },
        { "name": "Γάλα φρέσκο πολύ", "code": "36101.236109", "dependencies": [], "price": 0.3 },
        { "name": "Γάλα αμυγδάλου", "code": "36101.236112", "dependencies": [], "price": 0.5 },
        { "name": "Γάλα βρώμης", "code": "36101.236113", "dependencies": [], "price": 0.5 }
      ],
      "dependent_options": [],
      "order": 2059,
      "code": 36101,
      "maximum_selections": 0
    },
    {
      "type": "checkbox",
      "name": "Προσθέστε extra",
      "options": [
        { "name": "Σιρόπι καραμέλα", "code": "36102.236117", "dependencies": [], "price": 0.5 },
        { "name": "Σιρόπι βανίλια", "code": "36102.236120", "dependencies": [], "price": 0.5 },
        { "name": "Σαντιγύ", "code": "36102.236125", "dependencies": [], "price": 0.5 },
        { "name": "Κανέλα", "code": "36102.236127", "dependencies": [], "price": 0 },
        { "name": "Extra διπλή δόση espresso", "code": "36102.236128", "dependencies": [], "price": 1 }
      ],
      "dependent_options": [],
      "order": 2060,
      "code": 36102,
      "maximum_selections": 0
    }
  ]
}
```
