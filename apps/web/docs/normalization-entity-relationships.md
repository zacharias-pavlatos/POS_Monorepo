
## Entity Relationships / Normalization
Orders have items. Items reference products. Products belong to categories. Tables belong to sections.
How do you store and update these relationships?
 If you denormalize (embed items inside orders), updates are simpler but you duplicate data and risk inconsistency.
If you normalize (separate stores for orders, items, products), you need to handle joins and cascading updates.
 When a product's price changes, do existing order items update? 
 Probably not — you likely snapshot the price at order time. These decisions affect your entire data architecture.

<details>

#### The Problem

POS data is inherently relational:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Orders    │────►│ OrderItems  │────►│  Products   │
└─────────────┘     └─────────────┘     └──────┬──────┘
       │                                       │
       ▼                                       ▼
┌─────────────┐                         ┌─────────────┐
│   Tables    │                         │ Categories  │
└──────┬──────┘                         └─────────────┘
       │
       ▼
┌─────────────┐
│  Sections   │
└─────────────┘
```

How do you store and update these relationships?

#### Approach 1: Denormalized (Embedded)

Everything lives inside the parent object — items are nested arrays within orders.

| Pros | Cons |
|------|------|
| One fetch gets complete order | Data is duplicated (productName copied everywhere) |
| Simple mental model | Updating nested arrays is verbose |
| Natural for document DBs (MongoDB) | Cross-order queries require scanning everything |
| Good for read-heavy, simple apps | WebSocket updates must replace entire order |


```typescript

    interface Order {
        id: string;
        tableId: string;
        status: 'open' | 'paid';
        items: Array<{                    // 👈 Items live INSIDE the order
            id: string;
            productId: string;
            productName: string;            // Copied from product at order time
            price: number;                  // Copied from product at order time
            quantity: number;
        }>;
    }

    // Your store is just a flat list of orders
    const orders: Record = {
        'order-1': {
            id: 'order-1',
            tableId: 'table-5',
            status: 'open',
            items: [
            { id: 'item-1', productId: 'prod-burger', productName: 'Burger', price: 12.99, quantity: 2 },
            { id: 'item-2', productId: 'prod-fries', productName: 'Fries', price: 4.99, quantity: 1 },
            ]
        }
    };
```

**Reading is simple** — one lookup gets you everything:
```typescript
    const order = orders['order-1'];
    const items = order.items;  // Already there, no second lookup
```

**But updating is tricky** — to add an item, you must update the entire order:
```typescript
    // Adding an item requires spreading the whole order
    set(state => ({
    orders: {
        ...state.orders,
        'order-1': {
        ...state.orders['order-1'],
        items: [...state.orders['order-1'].items, newItem]  // 👈 Replace entire array
        }
    }
    }));
```

**And cross-order queries are painful:**

```typescript
    // "How many burgers were sold today?" — must loop through every order
    const burgerCount = Object.values(orders)
    .flatMap(order => order.items)
    .filter(item => item.productId === 'prod-burger')
    .reduce((sum, item) => sum + item.quantity, 0);
```


#### Approach 2: Normalized (Relational) ✅ Recommended

Entities live in separate stores, linked by IDs — just like database tables.

| Pros | Cons |
|------|------|
| No data duplication | Requires join to get full order |
| Surgical updates (touch only what changed) | More complex initial setup |
| Cross-entity queries are efficient | Must manage relationships manually |
| Matches server DB schema | WebSocket handlers need to route to correct store |
| WebSocket can update single item | — |


```typescript
// Each entity type has its own store
interface Order {
  id: string;
  tableId: string;
  status: 'open' | 'paid';
  // 👆 No items array — items live separately
}

interface OrderItem {
  id: string;
  orderId: string;      // 👈 Foreign key to Order
  productId: string;    // 👈 Foreign key to Product
  productName: string;  // Snapshotted at order time
  price: number;        // Snapshotted at order time
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
}

// Your store has separate maps for each entity type
const store = {
  orders: {
    'order-1': { id: 'order-1', tableId: 'table-5', status: 'open' }
  },
  orderItems: {
    'item-1': { id: 'item-1', orderId: 'order-1', productId: 'prod-burger', productName: 'Burger', price: 12.99, quantity: 2 },
    'item-2': { id: 'item-2', orderId: 'order-1', productId: 'prod-fries', productName: 'Fries', price: 4.99, quantity: 1 },
  },
  products: {
    'prod-burger': { id: 'prod-burger', name: 'Burger', price: 12.99, categoryId: 'cat-main' },
    'prod-fries': { id: 'prod-fries', name: 'Fries', price: 4.99, categoryId: 'cat-sides' },
  }
};
```

**Reading requires a join** — but it's a simple filter:
```typescript
const order = orders['order-1'];
const items = Object.values(orderItems).filter(item => item.orderId === 'order-1');
```

**Updating is surgical** — only touch what changed:
```typescript
// Adding an item is just inserting into orderItems
set(state => ({
  orderItems: {
    ...state.orderItems,
    [newItem.id]: newItem  // 👈 No need to touch the order at all
  }
}));
```

**Cross-entity queries are fast:**
```typescript
// "How many burgers were sold today?" — direct filter on items
const burgerCount = Object.values(orderItems)
  .filter(item => item.productId === 'prod-burger')
  .reduce((sum, item) => sum + item.quantity, 0);
```

</details>
