## Optimistic Updates
When a waiter taps "add item to order," they expect the UI to respond immediately — not spin for 500ms waiting for the server. 
Optimistic updates solve this by applying the change to local state first, then sending it to the server in the background. The UI feels instant because you're not blocking on network latency. 
The tradeoff is complexity: you need to track which changes are "pending" (not yet confirmed), handle the server response (which might include server-generated fields like timestamps), and roll back gracefully if the server rejects the change. For a POS, this is non-negotiable — a laggy interface during a dinner rush would be unusable.

<details>


#### The Problem

When a waiter taps "add item to order," they expect the UI to respond **immediately** — not spin for 500ms waiting for the server.

#### The Solution

**Optimistic updates** apply changes to local state _first_, then send to the server in the background:

```
User Action          Local State              Server
    │                    │                       │
    ├──── Add Item ─────►│                       │
    │                    │ (instant UI update)   │
    │                    ├────── POST /items ───►│
    │                    │                       │
    │                    │◄──── 200 OK ──────────┤
    │                    │ (merge server data)   │
```

```typescript
addItemOptimistic: (item) => {
  const tempId = `temp-${crypto.randomUUID()}`;
  const tempItem = { ...item, id: tempId, _pending: true };
  
  // 1. Update UI immediately
  set(state => ({
    orderItems: { ...state.orderItems, [tempId]: tempItem },
  }));
  
  // 2. Send to server
  api.orderItems.create(item)
    .then(serverItem => {
      // 3. Replace temp with server version
      set(state => {
        const { [tempId]: _, ...rest } = state.orderItems;
        return { orderItems: { ...rest, [serverItem.id]: serverItem } };
      });
    })
    .catch(error => {
      // 4. Rollback on failure
      get().removeOrderItem(tempId);
      toast.error('Failed to add item');
    });
},
```

#### The Tradeoffs

| Benefit | Cost |
|---------|------|
| Instant UI feedback | Must track "pending" state |
| Better perceived performance | Must handle server response |
| Works during brief disconnects | Must rollback on failure |

#### Key Questions to Answer

- Do you generate IDs client-side (UUID) or server-side?
- How do you identify "pending" vs "confirmed" entities?
- What's the rollback strategy on failure?

</details>
