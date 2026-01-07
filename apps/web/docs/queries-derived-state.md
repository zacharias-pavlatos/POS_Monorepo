
## Queries / Derived State 
Your raw data is a flat list of orders and order items, but your UI needs answers to questions:
 "Which orders are open for table 5?", "What's the total revenue today?", "Which items need to be sent to the kitchen?" These are derived queries — computed views over your base state. 
 The key requirement is reactivity: when an order's status changes from "open" to "paid," every derived query that depends on status needs to update automatically. Without proper reactivity, you'd either re-compute everything on every render (slow) or manually track dependencies (error-prone). This is where selectors in Zustand or computed queries in TanStack DB earn their keep — they efficiently recompute only what changed.

<details>

#### The Problem

Your UI needs answers to questions:
- "Which orders are open for table 5?"
- "What's the total revenue today?"
- "Which items need to be sent to the kitchen?"
- "How many covers have we done this shift?"

#### The Solution

**Derived queries** are computed views over your base state with **reactivity** — when underlying data changes, queries update automatically.

```typescript
// In your Zustand store or as selectors
const useOpenOrders = () => usePOSStore(state => 
  Object.values(state.orders).filter(o => o.status === 'open')
);

const useTableOrders = (tableId: string) => usePOSStore(state =>
  Object.values(state.orders).filter(o => 
    o.tableId === tableId && o.status === 'open'
  )
);

const useTodayRevenue = () => usePOSStore(state =>
  Object.values(state.orders)
    .filter(o => o.status === 'paid' && isToday(o.paidAt))
    .reduce((sum, o) => sum + o.total, 0)
);

const useKitchenQueue = () => usePOSStore(state =>
  Object.values(state.orderItems)
    .filter(item => !item.sentToKitchen && !item._pending)
);
```

#### The Challenge

Without proper reactivity, you'd either:
- **Re-compute everything on every render** — slow, wasteful
- **Manually track dependencies** — error-prone, bugs guaranteed

Zustand selectors handle this automatically — components only re-render when their specific slice changes.

#### Key Questions to Answer

-  What derived views does your UI need?
-  Are any derived queries expensive enough to memoize?
-  Do any queries need to combine multiple entity types?

</details>
