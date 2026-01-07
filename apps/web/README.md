# Example using Zustand + WebSockets + manual optimistic updates for a POS.

We’ll simulate:
- Orders being created
- Optimistic update in the UI
- Sync with a mock server
- Multi-client updates via WebSocket


```typescript 
// Set up the Zustand store

import create from 'zustand';
import { devtools } from 'zustand/middleware';

interface Order {
  id: string;
  tableId: string;
  waiterId: string;
  status: 'open' | 'paid';
  items: string[];
}

interface POSStore {
  orders: Record<string, Order>;
  addOrderOptimistic: (order: Order) => void;
  removeOrder: (orderId: string) => void;
  updateOrder: (order: Partial<Order> & { id: string }) => void;
  applyServerEvent: (order: Order) => void;
}

export const usePOSStore = create<POSStore>()(
  devtools((set, get) => ({
    orders: {},

    // Optimistic creation
    addOrderOptimistic: (order) => {
      set(state => ({
        orders: { ...state.orders, [order.id]: order },
      }));

      // simulate API call
      fakeApiCreateOrder(order)
        .then(serverOrder => {
          // merge server response (in case server adds timestamps, etc)
          get().updateOrder(serverOrder);
        })
        .catch(() => {
          // rollback if server fails
          get().removeOrder(order.id);
        });
    },

    removeOrder: (orderId) =>
      set(state => {
        const orders = { ...state.orders };
        delete orders[orderId];
        return { orders };
      }),

    updateOrder: (orderUpdate) =>
      set(state => ({
        orders: {
          ...state.orders,
          [orderUpdate.id]: { ...state.orders[orderUpdate.id], ...orderUpdate },
        },
      })),

    applyServerEvent: (order) =>
      set(state => ({
        orders: { ...state.orders, [order.id]: order },
      })),
  }))
);

// Mock API
function fakeApiCreateOrder(order: Order): Promise<Order> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // simulate success or failure
      Math.random() > 0.1 ? resolve(order) : reject();
    }, 500);
  });
}
```
What this does

- Local orders state is normalized (keyed by ID)
- addOrderOptimistic adds locally immediately, then calls the API
- On server failure, it rolls back
- applyServerEvent allows multi-client updates via WebSocket


### Hooking up WebSocket events
```typescript

const ws = new WebSocket('wss://my-pos-server');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data) as { type: string; payload: Order };
  if (data.type === 'order-updated') {
    usePOSStore.getState().applyServerEvent(data.payload);
  }
};
```


### UI component (React)

```typescript

import React, { useState } from 'react';
import { usePOSStore } from './store';
import { v4 as uuidv4 } from 'uuid';

export const OrderForm = () => {
  const addOrderOptimistic = usePOSStore(state => state.addOrderOptimistic);
  const [tableId, setTableId] = useState('');
  const [items, setItems] = useState('');

  const submitOrder = () => {
    const order = {
      id: uuidv4(),
      tableId,
      waiterId: 'waiter-123',
      status: 'open' as const,
      items: items.split(','),
    };
    addOrderOptimistic(order);
    setTableId('');
    setItems('');
  };

  return (
    <div>
      <input placeholder="Table ID" value={tableId} onChange={e => setTableId(e.target.value)} />
      <input placeholder="Items (comma)" value={items} onChange={e => setItems(e.target.value)} />
      <button onClick={submitOrder}>Add Order</button>
    </div>
  );
};

export const OrdersList = () => {
  const orders = usePOSStore(state => Object.values(state.orders));
  return (
    <ul>
      {orders.map(o => (
        <li key={o.id}>
          Table {o.tableId}: {o.items.join(', ')} ({o.status})
        </li>
      ))}
    </ul>
  );
};


```


## 💡 Observations from this small example

1. Optimistic updates are already manual — you see the rollback logic.

2. Server reconciliation is manual (applyServerEvent).

3. Derived views (e.g., “open orders by table”) would require another selector or computed function:

    ```typescript
        const openOrders = usePOSStore(state =>
            Object.values(state.orders).filter(o => o.status === 'open')
        );
    ```

4. Offline support would require a queue and retry logic for failed API calls.

5. Multi-client updates are simple for one entity, but become messy as you add more entities and relations.



####  Key takeaway 

Even in a small example you quickly need manual wiring for:
- Rollback
- Server events
- Derived queries
- Offline retry queue


---

## Dive deeper

Let expand the example and handle derived relational views. This will make the complexity clear.

We’ll show:
- Orders grouped by table
- Orders grouped by waiter
- Revenue per table

### Extend the Zustand store
```typescript
interface Table {
  id: string;
  name: string;
}

interface POSStore {
  orders: Record<string, Order>;
  tables: Record<string, Table>;
  addOrderOptimistic: (order: Order) => void;
  removeOrder: (orderId: string) => void;
  updateOrder: (order: Partial<Order> & { id: string }) => void;
  applyServerEvent: (order: Order) => void;

  // Derived views (manual)
  getOrdersByTable: () => Record<string, Order[]>;
  getOrdersByWaiter: () => Record<string, Order[]>;
  getRevenueByTable: () => Record<string, number>;
}

export const usePOSStore = create<POSStore>((set, get) => ({
  orders: {},
  tables: {
    't1': { id: 't1', name: 'Table 1' },
    't2': { id: 't2', name: 'Table 2' },
  },

  addOrderOptimistic: (order) => {
    set(state => ({ orders: { ...state.orders, [order.id]: order } }));
    fakeApiCreateOrder(order)
      .then(serverOrder => get().updateOrder(serverOrder))
      .catch(() => get().removeOrder(order.id));
  },

  removeOrder: (orderId) => set(state => {
    const orders = { ...state.orders };
    delete orders[orderId];
    return { orders };
  }),

  updateOrder: (orderUpdate) => set(state => ({
    orders: { ...state.orders, [orderUpdate.id]: { ...state.orders[orderUpdate.id], ...orderUpdate } },
  })),

  applyServerEvent: (order) => set(state => ({
    orders: { ...state.orders, [order.id]: order },
  })),

  // Derived views (manual)
  getOrdersByTable: () => {
    const result: Record<string, Order[]> = {};
    Object.values(get().orders).forEach(order => {
      if (!result[order.tableId]) result[order.tableId] = [];
      result[order.tableId].push(order);
    });
    return result;
  },

  getOrdersByWaiter: () => {
    const result: Record<string, Order[]> = {};
    Object.values(get().orders).forEach(order => {
      if (!result[order.waiterId]) result[order.waiterId] = [];
      result[order.waiterId].push(order);
    });
    return result;
  },

  getRevenueByTable: () => {
    const result: Record<string, number> = {};
    Object.values(get().orders).forEach(order => {
      if (order.status === 'paid') {
        result[order.tableId] = (result[order.tableId] || 0) + order.items.length * 10; // assume $10 per item
      }
    });
    return result;
  },
}));

// Mock API (same as before)
function fakeApiCreateOrder(order: Order): Promise<Order> {
  return new Promise((resolve, reject) => {
    setTimeout(() => Math.random() > 0.1 ? resolve(order) : reject(), 500);
  });
}
```



### UI for derived views
```typescript
import React from 'react';
import { usePOSStore } from './store';

export const DerivedViews = () => {
  const ordersByTable = usePOSStore(state => state.getOrdersByTable());
  const ordersByWaiter = usePOSStore(state => state.getOrdersByWaiter());
  const revenueByTable = usePOSStore(state => state.getRevenueByTable());

  return (
    <div>
      <h2>Orders by Table</h2>
      {Object.entries(ordersByTable).map(([tableId, orders]) => (
        <div key={tableId}>
          <strong>{tableId}</strong>: {orders.map(o => o.items.join(', ')).join(' | ')}
        </div>
      ))}

      <h2>Orders by Waiter</h2>
      {Object.entries(ordersByWaiter).map(([waiterId, orders]) => (
        <div key={waiterId}>
          <strong>{waiterId}</strong>: {orders.map(o => o.items.join(', ')).join(' | ')}
        </div>
      ))}

      <h2>Revenue by Table</h2>
      {Object.entries(revenueByTable).map(([tableId, revenue]) => (
        <div key={tableId}>
          <strong>{tableId}</strong>: ${revenue}
        </div>
      ))}
    </div>
  );
};

```


### 💡  Observations:

1. Derived views are recomputed manually every render:

    - Orders by table
    - Orders by waiter
    - Revenue calculations

2. Incremental updates are not automatic:

    - Any small change triggers recomputation of all derived views
    - With hundreds of tables/orders, this could become slow

3. Multi-client updates:
    - Each WebSocket event must call applyServerEvent
    - Derived views don’t automatically update; we rely on React state subscription

4. Offline / retry queue:

    - Still manual
    - Each order must be retried if offline
    - Rollbacks must be handled per entity

5. Mental overhead grows fast:

    - Adding discounts, promotions, or complex joins means more derived methods
    - Potential for inconsistent state if some edge cases aren’t handled

✅ Key Takeaways

- With <1k records, this works fine — manageable and completely free

- You quickly start writing boilerplate for:

    - Derived queries
    - Rollback logic
    - Multi-client merge logic

This illustrates **why libraries like TanStack DB or RxDB exist** they automate:
- **incremental derived views** 
- **optimistic updates** 
- **multi-client reconciliation**



 with “incremental update optimization”, where derived views recompute only affected tables/orders


## Let’s take the next step to “incremental update optimization” and optimize the derived views so that only the affected parts update when orders change.

Instead of recomputing all tables and waiters every time an order changes, we:

1. Keep a cache of derived results (ordersByTable, ordersByWaiter, revenueByTable) in the store
2. Update only the affected table/waiter when an order is added/updated/removed

### Updated Zustand store with incremental updates


```typescript
import create from 'zustand';

interface Table { id: string; name: string; }
interface Order {
  id: string;
  tableId: string;
  waiterId: string;
  status: 'open' | 'paid';
  items: string[];
}

interface POSStore {
  orders: Record<string, Order>;
  tables: Record<string, Table>;

  // Incremental caches
  ordersByTable: Record<string, Order[]>;
  ordersByWaiter: Record<string, Order[]>;
  revenueByTable: Record<string, number>;

  addOrderOptimistic: (order: Order) => void;
  removeOrder: (orderId: string) => void;
  updateOrder: (order: Partial<Order> & { id: string }) => void;
  applyServerEvent: (order: Order) => void;
}

export const usePOSStore = create<POSStore>((set, get) => ({
  orders: {},
  tables: {
    t1: { id: 't1', name: 'Table 1' },
    t2: { id: 't2', name: 'Table 2' },
  },

  ordersByTable: {},
  ordersByWaiter: {},
  revenueByTable: {},

  addOrderOptimistic: (order) => {
    set(state => {
      const orders = { ...state.orders, [order.id]: order };

      // incremental caches
      const ordersByTable = { ...state.ordersByTable };
      ordersByTable[order.tableId] = [...(ordersByTable[order.tableId] || []), order];

      const ordersByWaiter = { ...state.ordersByWaiter };
      ordersByWaiter[order.waiterId] = [...(ordersByWaiter[order.waiterId] || []), order];

      const revenueByTable = { ...state.revenueByTable };
      if (order.status === 'paid') {
        revenueByTable[order.tableId] = (revenueByTable[order.tableId] || 0) + order.items.length * 10;
      }

      return { orders, ordersByTable, ordersByWaiter, revenueByTable };
    });

    // fake API call with rollback
    fakeApiCreateOrder(order)
      .then(serverOrder => get().updateOrder(serverOrder))
      .catch(() => get().removeOrder(order.id));
  },

  removeOrder: (orderId) => {
    const order = get().orders[orderId];
    if (!order) return;

    set(state => {
      const orders = { ...state.orders };
      delete orders[orderId];

      // incremental caches
      const ordersByTable = { ...state.ordersByTable };
      ordersByTable[order.tableId] = ordersByTable[order.tableId].filter(o => o.id !== orderId);

      const ordersByWaiter = { ...state.ordersByWaiter };
      ordersByWaiter[order.waiterId] = ordersByWaiter[order.waiterId].filter(o => o.id !== orderId);

      const revenueByTable = { ...state.revenueByTable };
      if (order.status === 'paid') {
        revenueByTable[order.tableId] = (revenueByTable[order.tableId] || 0) - order.items.length * 10;
      }

      return { orders, ordersByTable, ordersByWaiter, revenueByTable };
    });
  },

  updateOrder: (orderUpdate) => {
    const oldOrder = get().orders[orderUpdate.id];
    if (!oldOrder) return;

    set(state => {
      const orders = { ...state.orders, [orderUpdate.id]: { ...oldOrder, ...orderUpdate } };
      const newOrder = orders[orderUpdate.id];

      // incremental updates for ordersByTable
      const ordersByTable = { ...state.ordersByTable };
      if (oldOrder.tableId !== newOrder.tableId) {
        // remove from old
        ordersByTable[oldOrder.tableId] = ordersByTable[oldOrder.tableId].filter(o => o.id !== newOrder.id);
        // add to new
        ordersByTable[newOrder.tableId] = [...(ordersByTable[newOrder.tableId] || []), newOrder];
      } else {
        ordersByTable[newOrder.tableId] = ordersByTable[newOrder.tableId].map(o =>
          o.id === newOrder.id ? newOrder : o
        );
      }

      // incremental updates for ordersByWaiter
      const ordersByWaiter = { ...state.ordersByWaiter };
      if (oldOrder.waiterId !== newOrder.waiterId) {
        ordersByWaiter[oldOrder.waiterId] = ordersByWaiter[oldOrder.waiterId].filter(o => o.id !== newOrder.id);
        ordersByWaiter[newOrder.waiterId] = [...(ordersByWaiter[newOrder.waiterId] || []), newOrder];
      } else {
        ordersByWaiter[newOrder.waiterId] = ordersByWaiter[newOrder.waiterId].map(o =>
          o.id === newOrder.id ? newOrder : o
        );
      }

      // incremental revenue
      const revenueByTable = { ...state.revenueByTable };
      if (oldOrder.status === 'paid') {
        revenueByTable[oldOrder.tableId] -= oldOrder.items.length * 10;
      }
      if (newOrder.status === 'paid') {
        revenueByTable[newOrder.tableId] = (revenueByTable[newOrder.tableId] || 0) + newOrder.items.length * 10;
      }

      return { orders, ordersByTable, ordersByWaiter, revenueByTable };
    });
  },

  applyServerEvent: (order) => get().updateOrder(order),
}));

// Fake API
function fakeApiCreateOrder(order: Order): Promise<Order> {
  return new Promise((resolve, reject) => {
    setTimeout(() => Math.random() > 0.1 ? resolve(order) : reject(), 500);
  });
}

```


### Observations
Incremental caches are pre-computed pieces of state (like “orders by table” or “revenue by table”) that you update only where something changed, instead of recalculating everything again.

1. Derived views now update only the affected table/waiter → much more efficient

2. Manual complexity increased dramatically:
    - Every add/remove/update method has incremental logic
    - Rollback + multi-client merge must be updated in all caches

3. This is exactly the logic TanStack DB automates automatically:
   - Live queries 
   - Incremental recompute 
   - Reconciliation

### Key takeaway

- With incremental updates, performance is much better for large numbers of orders

- But boilerplate grows fast

- Every new derived view (e.g., promotions, discounts, order history per day) requires more code

- You now see why people adopt libraries like TanStack DB, RxDB, or Replicache for real-time POS systems

---
---
---

## What “reconciliation” actually means (in your POS)

***Reconciliation = making local state and server state agree over time***

In your app, state exists in multiple places at the same time:
   - Waiter’s device (offline / online)
   - Another waiter’s device
   - Kitchen screen
   - Server database

They will **not update** at the same time.

Reconciliation answers:

***“When these states disagree, who wins and how do we merge?”***

CRDTs (Conflict-free Replicated Data Types) solve this exact problem:

Multiple clients update the same data

Possibly offline

In any order

----
----
----



## Domain Events over WebSocket (Pattern)

Instead of sending ad-hoc WebSocket messages (e.g. `"order.created"`), define **Domain Events** that represent **facts in the business domain**.

### What is a Domain Event?
A domain event describes **something that already happened** in the system, using business language.

Examples:
- `OrderCreated`
- `OrderUpdated`
- `OrderPaid`

- ❌ order.updated.ws
- ❌ syncOrder
- ❌ updateOrderEvent


They are:
- Past tense
- Transport-agnostic
- Shared between server and client

---

### Shared Event Contract
Define events in a shared package used by both server and client.

```ts
type OrderCreated = {
  type: 'OrderCreated'
  tenantId: string
  payload: Order
}
```


https://www.youtube.com/watch?v=3gVBjTMS8FE

https://zero.rocicorp.dev/

https://youtu.be/3gVBjTMS8FE?t=706

https://replicache.dev/
https://youtu.be/3gVBjTMS8FE?t=645

https://dexie.org/
https://youtu.be/3gVBjTMS8FE?t=1037

https://tinybase.org/
https://youtu.be/3gVBjTMS8FE?t=1462

https://jazz.tools/
https://youtu.be/3gVBjTMS8FE?t=1516


https://tanstack.com/db/


https://legendapp.com/open-source/state/
https://youtu.be/3gVBjTMS8FE?t=1623

Handles optimistic updates, retries, offline persistence, and server sync in one unified API. No need to manually track pending operations.


```typescript
import { observable, batch, when } from '@legendapp/state';
import { syncObservable, configureSynced } from '@legendapp/state/sync';
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage';
// For React Native, use:
// import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv';

// -------------------------
// Types
// -------------------------
interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  modifiers?: string[];
  notes?: string;
}

interface Order {
  id: string;
  tableId: string;
  waiterId: string;
  status: 'draft' | 'open' | 'submitted' | 'preparing' | 'ready' | 'served' | 'paid';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

interface Table {
  id: string;
  name: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'dirty';
  currentOrderId?: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
}

interface StaffMember {
  id: string;
  name: string;
  role: 'server' | 'bartender' | 'kitchen' | 'manager';
  pin: string;
}

// -------------------------
// Configure Sync Plugin
// -------------------------
const API_BASE = '/api';

const mySynced = configureSynced({
  persist: {
    plugin: ObservablePersistLocalStorage,
    retrySync: true, // Retry failed syncs on next load
  },
  retry: {
    infinite: true,
    backoff: 'exponential',
    maxDelay: 30000,
  },
  debounceSet: 500, // Debounce rapid changes
});

// -------------------------
// Store
// -------------------------
export const store$ = observable({
  // ===== Data Collections =====
  orders: {} as Record<string, Order>,
  tables: {} as Record<string, Table>,
  menuItems: {} as Record<string, MenuItem>,
  staff: {} as Record<string, StaffMember>,

  // ===== Session State =====
  session: {
    currentUserId: null as string | null,
    currentTableId: null as string | null,
    isOnline: true,
    lastSyncedAt: null as string | null,
  },

  // ===== UI State =====
  ui: {
    activeTab: 'tables' as 'tables' | 'orders' | 'kitchen' | 'reports',
    selectedOrderId: null as string | null,
    isProcessingPayment: false,
  },

  // ===== Computed Values (just functions!) =====
  
  // Get orders as array, sorted by creation time
  ordersArray: (): Order[] => {
    return Object.values(store$.orders.get()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  // Orders filtered by status
  ordersByStatus: (status: Order['status']): Order[] => {
    return store$.ordersArray().filter((o) => o.status === status);
  },

  // Active orders (not paid/cancelled)
  activeOrders: (): Order[] => {
    return store$.ordersArray().filter((o) => o.status !== 'paid');
  },

  // Kitchen queue - orders that need preparation
  kitchenQueue: (): Order[] => {
    return store$.ordersArray()
      .filter((o) => ['submitted', 'preparing'].includes(o.status))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  // Orders for a specific table
  ordersByTable: (tableId: string): Order[] => {
    return store$.ordersArray().filter((o) => o.tableId === tableId);
  },

  // Current open order for a table
  currentTableOrder: (tableId: string): Order | undefined => {
    return store$.ordersByTable(tableId).find((o) => o.status !== 'paid');
  },

  // Tables as array
  tablesArray: (): Table[] => {
    return Object.values(store$.tables.get());
  },

  // Available tables
  availableTables: (): Table[] => {
    return store$.tablesArray().filter((t) => t.status === 'available');
  },

  // Summary stats
  stats: () => {
    const orders = store$.ordersArray();
    const today = new Date().toDateString();
    const todaysOrders = orders.filter(
      (o) => new Date(o.createdAt).toDateString() === today
    );

    return {
      totalOrders: todaysOrders.length,
      totalRevenue: todaysOrders
        .filter((o) => o.status === 'paid')
        .reduce((sum, o) => sum + o.total, 0),
      activeOrders: store$.activeOrders().length,
      averageOrderValue:
        todaysOrders.length > 0
          ? todaysOrders.reduce((sum, o) => sum + o.total, 0) / todaysOrders.length
          : 0,
    };
  },

  // ===== Actions =====
  actions: {
    // Create a new order
    createOrder: (tableId: string, waiterId: string): Order => {
      const now = new Date().toISOString();
      const order: Order = {
        id: crypto.randomUUID(),
        tableId,
        waiterId,
        status: 'draft',
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        createdAt: now,
        updatedAt: now,
      };

      batch(() => {
        store$.orders[order.id].set(order);
        store$.tables[tableId].status.set('occupied');
        store$.tables[tableId].currentOrderId.set(order.id);
        store$.ui.selectedOrderId.set(order.id);
      });

      return order;
    },

    // Add item to order
    addItemToOrder: (orderId: string, menuItemId: string, quantity = 1, notes?: string) => {
      const menuItem = store$.menuItems[menuItemId].get();
      if (!menuItem) throw new Error(`Menu item ${menuItemId} not found`);

      const orderItem: OrderItem = {
        id: crypto.randomUUID(),
        menuItemId,
        name: menuItem.name,
        quantity,
        price: menuItem.price,
        notes,
      };

      const order$ = store$.orders[orderId];
      
      batch(() => {
        order$.items.push(orderItem);
        order$.updatedAt.set(new Date().toISOString());
        
        // Recalculate totals
        const items = order$.items.get();
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const tax = subtotal * 0.08; // 8% tax
        
        order$.subtotal.set(subtotal);
        order$.tax.set(tax);
        order$.total.set(subtotal + tax);
      });
    },

    // Update item quantity
    updateItemQuantity: (orderId: string, itemId: string, quantity: number) => {
      const order$ = store$.orders[orderId];
      const items = order$.items.get();
      const itemIndex = items.findIndex((i) => i.id === itemId);
      
      if (itemIndex === -1) return;

      batch(() => {
        if (quantity <= 0) {
          // Remove item
          order$.items.set(items.filter((i) => i.id !== itemId));
        } else {
          order$.items[itemIndex].quantity.set(quantity);
        }

        order$.updatedAt.set(new Date().toISOString());

        // Recalculate totals
        const updatedItems = order$.items.get();
        const subtotal = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const tax = subtotal * 0.08;

        order$.subtotal.set(subtotal);
        order$.tax.set(tax);
        order$.total.set(subtotal + tax);
      });
    },

    // Submit order to kitchen
    submitOrder: (orderId: string) => {
      batch(() => {
        store$.orders[orderId].status.set('submitted');
        store$.orders[orderId].updatedAt.set(new Date().toISOString());
      });
    },

    // Update order status (kitchen workflow)
    updateOrderStatus: (orderId: string, status: Order['status']) => {
      batch(() => {
        store$.orders[orderId].status.set(status);
        store$.orders[orderId].updatedAt.set(new Date().toISOString());

        // If paid, free up the table
        if (status === 'paid') {
          const tableId = store$.orders[orderId].tableId.get();
          store$.tables[tableId].status.set('dirty');
          store$.tables[tableId].currentOrderId.delete();
        }
      });
    },

    // Process payment
    processPayment: async (orderId: string, _paymentMethod: 'cash' | 'card' | 'split') => {
      store$.ui.isProcessingPayment.set(true);

      try {
        // Simulate payment processing
        await new Promise((resolve) => setTimeout(resolve, 1500));

        store$.actions.updateOrderStatus(orderId, 'paid');
        store$.ui.selectedOrderId.set(null);

        return { success: true };
      } catch (error) {
        return { success: false, error };
      } finally {
        store$.ui.isProcessingPayment.set(false);
      }
    },

    // Clear table (after cleaning)
    clearTable: (tableId: string) => {
      store$.tables[tableId].status.set('available');
    },

    // Login
    login: (staffId: string) => {
      store$.session.currentUserId.set(staffId);
    },

    // Logout
    logout: () => {
      batch(() => {
        store$.session.currentUserId.set(null);
        store$.session.currentTableId.set(null);
        store$.ui.selectedOrderId.set(null);
      });
    },
  },
});

// -------------------------
// Sync Configuration
// -------------------------

// Sync orders with server
syncObservable(store$.orders, mySynced({
  persist: {
    name: 'pos-orders',
  },
  get: async () => {
    const response = await fetch(`${API_BASE}/orders`);
    if (!response.ok) throw new Error('Failed to fetch orders');
    const orders: Order[] = await response.json();
    return Object.fromEntries(orders.map((o) => [o.id, o]));
  },
  set: async ({ value, changes }) => {
    // Only sync changed items
    for (const change of changes) {
      const orderId = change.path[0] as string;
      const order = value[orderId];

      if (!order) {
        // Deleted
        await fetch(`${API_BASE}/orders/${orderId}`, { method: 'DELETE' });
      } else if (change.path.length === 1) {
        // Created or replaced
        await fetch(`${API_BASE}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order),
        });
      } else {
        // Updated
        await fetch(`${API_BASE}/orders/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order),
        });
      }
    }
  },
}));

// Sync tables (read-only from server, can update status locally)
syncObservable(store$.tables, mySynced({
  persist: {
    name: 'pos-tables',
  },
  get: async () => {
    const response = await fetch(`${API_BASE}/tables`);
    if (!response.ok) throw new Error('Failed to fetch tables');
    const tables: Table[] = await response.json();
    return Object.fromEntries(tables.map((t) => [t.id, t]));
  },
  set: async ({ value, changes }) => {
    for (const change of changes) {
      const tableId = change.path[0] as string;
      const table = value[tableId];
      if (table) {
        await fetch(`${API_BASE}/tables/${tableId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: table.status }),
        });
      }
    }
  },
}));

// Sync menu items (read-only)
syncObservable(store$.menuItems, mySynced({
  persist: {
    name: 'pos-menu',
  },
  get: async () => {
    const response = await fetch(`${API_BASE}/menu`);
    if (!response.ok) throw new Error('Failed to fetch menu');
    const items: MenuItem[] = await response.json();
    return Object.fromEntries(items.map((i) => [i.id, i]));
  },
}));

// Persist session locally only (no server sync)
syncObservable(store$.session, {
  persist: {
    name: 'pos-session',
    plugin: ObservablePersistLocalStorage,
  },
});

// -------------------------
// WebSocket for Real-time Updates
// -------------------------
export function connectWebSocket(url: string) {
  const ws = new WebSocket(url);

  ws.onopen = () => {
    store$.session.isOnline.set(true);
  };

  ws.onclose = () => {
    store$.session.isOnline.set(false);
    // Auto-reconnect after 3 seconds
    setTimeout(() => connectWebSocket(url), 3000);
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);

    switch (message.type) {
      case 'order:created':
      case 'order:updated':
        store$.orders[message.payload.id].set(message.payload);
        break;

      case 'order:deleted':
        store$.orders[message.payload.id].delete();
        break;

      case 'table:updated':
        store$.tables[message.payload.id].set(message.payload);
        break;

      case 'menu:updated':
        store$.menuItems[message.payload.id].set(message.payload);
        break;
    }

    store$.session.lastSyncedAt.set(new Date().toISOString());
  };

  return ws;
}

// -------------------------
// Utility: Wait for data to load
// -------------------------
export function whenOrdersLoaded() {
  return when(() => Object.keys(store$.orders.get()).length > 0);
}

export function whenTablesLoaded() {
  return when(() => Object.keys(store$.tables.get()).length > 0);
}


```

### Legend-State does optimistic updates by default. Here's the flow:

When you call store$.orders[id].status.set('preparing'):

1. **Immediate local update** — The observable changes instantly. UI reflects the new status right away. User sees "preparing" immediately.

2. **Persist to localStorage** — The change is saved locally (if persist is configured). This protects against browser crash or refresh.

3. **Debounce wait** — The 500ms debounce timer starts. If more changes come in, it resets. This batches rapid edits.

4. **Send to server** — After debounce, the set function you defined in syncObservable fires with the changes.

5. **Success** — Nothing special happens. Local state already matches what server accepted.

6. **Failure** — This is where retry kicks in. It keeps trying with exponential backoff. The local state stays as-is (optimistic). The syncState shows error and pending so you can indicate it visually.

**Key point:** Legend-State assumes success. It doesn't roll back automatically on failure — it just keeps retrying until it works. This differs from the Zustand pattern where you manually track rollbackData and restore on error.


If you truly need **rollback-on-failure** (rare for most apps), you'd handle that ***manually*** in your set function by **catching the error** and **reverting the observable yourself**. But the philosophy here is "offline-first" — local state is truth, server eventually catches up.




# Tanstack DB
TanStack DB is **not a sync engine**.
TanStack DB is a **reactive client-side store** — it holds data in memory, lets you query it with live queries, and handles optimistic mutations.

The sync engine is separate. TanStack DB plugs INTO sync engines

**What TanStack DB does:**

- Stores data in memory as "collections"
- Runs live queries with differential dataflow (sub-ms updates)
- Manages optimistic state with automatic rollback
- Glues together data from multiple sources

**What TanStack DB does NOT do:**

- Persist to disk (needs plugin)
- Sync with server (needs sync engine)
- Handle offline queue/retry (needs sync engine)


**Key point:**
- TanStack DB solves client-side state complexity, not syncing or offline persistence.

- Legend-State can do reactive state + persistence + easy server-sync (via REST + WebSocket)


TanStack DB provides plugins for things like:

1. Server sync / transport

    - You can write a plugin that listens for server events (REST/WebSocket) and updates the DB automatically.
    - Similarly, you can intercept local writes and push them to the server.

2. Offline persistence

    - IndexedDB or localStorage plugins can persist the client DB.
    - When the app restarts, the DB reloads automatically.
    
Key point: The sync logic is not built-in, it’s implemented via a plugin.

https://www.freecodecamp.org/news/how-to-build-a-crud-app-with-tanstack-start-and-tanstackdb-with-rxdb-integration/#heading-understanding-local-persistence-with-rxdb




TanStack DB lets you query your data however your components need it, with a blazing-fast local query engine, real-time reactivity and instant optimistic updates.

Instead of choosing between the least of two evils:

1. view-specific APIs - complicating your backend and leading to network waterfalls
2. load everything and filter - leading to slow loads and sluggish client performance

TanStack DB enables a new way:

3. normalized collections - keep your backend simple
4. query-driven sync - optimizes your data loading
5. sub-millisecond live queries - keep your app fast and responsive

It extends TanStack Query with collections, live queries and optimistic mutations, working seamlessly with REST APIs, sync engines, or any data source.

["Tanner Linsley: TanStack DB"]https://youtu.be/hy9pNJMFfyM?t=544


https://capacitorjs.com/docs/guides/storage


https://youtu.be/k0S3Dq0k1pA?t=40

querrign data from very large dataset (search ,combine,gets)

live queries 
