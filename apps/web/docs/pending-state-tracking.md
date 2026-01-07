## Pending State Tracking
Beyond just "optimistic," you need granular visibility into what is pending. Is this specific order item synced? Is the whole order still uploading? Did a retry just fail? Your UI needs to reflect this — maybe a subtle indicator that an item is still saving, or a warning if something has been pending too long. This also affects what actions are allowed: can you mark an order as "paid" if some items are still pending? Probably not. You need to track pending state per-entity, not just globally.

<details>


#### The Problem

Beyond just "optimistic," you need granular visibility into _what_ is pending:
- Is this specific order item synced?
- Is the whole order still uploading?
- Did a retry just fail?

#### The Solution

Track pending state **per-entity**:

```typescript
interface OrderItem {
  id: string;
  name: string;
  price: number;
  
  // Sync metadata
  _pending?: boolean;      // Currently syncing
  _pendingSince?: number;  // Timestamp for timeout detection
  _error?: string;         // Last error message
  _retryCount?: number;    // Number of retry attempts
}
```

#### UI Implications

| State | UI Treatment |
|-------|--------------|
| `_pending: true` | Subtle spinner or slightly dimmed |
| `_pending` for > 5s | "Still saving..." warning |
| `_error` present | Red indicator, retry button |
| No flags | Normal display |

#### Action Blocking

Some actions should be blocked based on pending state:

```typescript
const canMarkAsPaid = (order: Order): boolean => {
  const items = getItemsForOrder(order.id);
  const hasPendingItems = items.some(item => item._pending);
  const orderPending = order._pending;
  
  return !hasPendingItems && !orderPending;
};
```

#### Key Questions to Answer

-  What actions are blocked by pending state?
-  How long before "pending" becomes "stuck"?
-  Do you show pending state to users or hide it?

</details>
