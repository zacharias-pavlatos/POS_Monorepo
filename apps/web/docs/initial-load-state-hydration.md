##  Initial Load / State Hydration 
When the app starts (or a waiter logs in), you need to populate local state with existing data from the server. Do you fetch everything (all open orders for the restaurant) or scope it (only orders for this waiter's section)? How do you handle a slow initial load — show a loading screen or let them start working with partial data? For a POS, you probably want all open orders loaded before allowing interaction, but you don't need closed orders from last month. You also need to decide when to re-hydrate: on every app focus? On WebSocket reconnect? This ties directly into your "reconnection recovery" problem.

<details>

#### The Problem

When the app starts (or a waiter logs in), you need to populate local state with existing data from the server. But how much data?

| Approach | Pros | Cons |
|----------|------|------|
| **Load everything** | Simple, complete | Slow startup, wasted bandwidth |
| **Load scoped data** | Fast, efficient | Complex queries, might miss data |
| **Load on demand** | Minimal initial load | Latency when accessing new data |

#### The Solution

For a POS, you typically want:

- ✅ **All open orders** for the restaurant (or section)
- ✅ **Product catalog** (menu items, modifiers, categories)
- ✅ **Table/floor layout**
- ❌ **Closed orders** from previous days
- ❌ **Historical reports**

```typescript
async function hydrateStore() {
    const [orders, products, tables] = await Promise.all([
        api.orders.getOpen(),
        api.products.getActive(),
        api.tables.getAll(),
    ]);

    store.setState({
        orders: normalize(orders),
        products: normalize(products),
        tables: normalize(tables),
        hydrated: true,
    });
}
```

#### The Challenge

You also need to decide **when** to re-hydrate:

| Trigger | Action |
|---------|--------|
| App start | Full hydration |
| WebSocket reconnect | Delta sync or full re-hydration |
| App returns to foreground | Check for stale data |
| User switches section | Load new section's data |

#### Key Questions to Answer

-  What data is required before the UI becomes interactive?
-  How do you show progress during initial load?
-  What triggers a re-hydration?

</details>
