## Real-time Multi-Client Sync
In a restaurant, you have multiple terminals and waiters operating simultaneously — one waiter creates an order at table 5, another adds items to table 3, and the cashier marks an order as paid. Every device needs to see these changes instantly without manually refreshing. This is where WebSockets come in: the server broadcasts every change to all connected clients, and each client applies those changes to their local state. Without this, waiter A would create an order, waiter B wouldn't see it, and you'd end up with duplicate orders or confusion about which tables are occupied. The challenge is ensuring that incoming server events merge cleanly with your local state, especially when you have pending local changes that haven't been confirmed yet.

<details>

#### The Problem

In a restaurant, you have multiple terminals and waiters operating simultaneously:
- Waiter A creates an order at table 5
- Waiter B adds items to table 3
- The cashier marks an order as paid

Without real-time sync, waiter A would create an order that waiter B never sees, leading to duplicate orders or confusion about which tables are occupied.


#### The Solution

**WebSockets** enable the server to broadcast every change to all connected clients:

```
┌─────────────┐     WebSocket       ┌─────────────┐
│  Terminal A │ ◄─────────────────► │   Server    │
└─────────────┘                     └──────┬──────┘
                                           │
┌─────────────┐     WebSocket              │
│  Terminal B │ ◄──────────────────────────┤
└─────────────┘                            │
                                           │
┌─────────────┐     WebSocket              │
│   Cashier   │ ◄──────────────────────────┘
└─────────────┘
```

```typescript

// Client-side WebSocket handler
ws.onmessage = (event) => {
  const { type, payload } = JSON.parse(event.data);
  
  switch (type) {
    case 'order-created':
      store.getState().applyServerOrder(payload);
      break;
    case 'order-updated':
      store.getState().applyServerOrder(payload);
      break;
    case 'order-deleted':
      store.getState().removeOrder(payload.id);
      break;
  }
};
```

#### The Challenge

Incoming server events must merge cleanly with local state, **especially when you have pending local changes that haven't been confirmed yet**. Race conditions between optimistic updates and WebSocket broadcasts require careful handling.

#### Key Questions to Answer

-  What events does the server broadcast? (created, updated, deleted)
-  How do you handle events for entities you're currently editing?
-  What happens when a WebSocket event arrives before your API call returns?

</details>
