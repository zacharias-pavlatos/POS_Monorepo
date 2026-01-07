## Tombstones / Soft Deletes
When an order is deleted (cancelled, voided), how do other clients know? If you just remove it from the server, clients with that order cached will never know it's gone. Tombstones solve this: instead of deleting, you mark deleted: true and sync that flag. Clients see the tombstone and remove the local copy. Eventually you clean up old tombstones (after 24 hours, after all clients have synced). For a POS, this matters for voided orders, removed items, and cancelled reservations.

<details>


#### The Problem

```
Server: DELETE order #123 → Removed from database

Terminal A: Still shows order #123 (cached)
Terminal B: Still shows order #123 (cached)
Kitchen:    Still shows order #123 (cached)

💥 Ghost order haunts your POS
```

#### The Solution

**Tombstones**: Mark as deleted instead of hard-deleting:

```typescript
interface Order {
  id: string;
  status: 'open' | 'paid' | 'voided';
  
  // Soft delete
  deleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletedReason?: string;
}
```

WebSocket broadcasts the tombstone, all clients remove from UI.

#### Cleanup Strategy

- Keep tombstones active for 24-48 hours
- Archive to separate table for audits
- Purge from active sync

#### Key Questions to Answer

-  Which entities need soft delete?
-  How long do tombstones stay active?
-  Do you need audit trail for deletions?


</details>
