
## Permissions / Scoping
Not all data should sync to all clients. A waiter sees their section's orders. A manager sees everything plus reports. The kitchen display sees only items to prepare, not payment info. Your sync logic needs to respect these boundaries — both for security (don't leak data) and performance (don't sync irrelevant data). This often means your WebSocket subscriptions are scoped: "subscribe to orders where sectionId = X" rather than "subscribe to all orders."

<details>

#### The Problem

| Role | Should See | Should NOT See |
|------|-----------|----------------|
| Waiter | Their section's orders | Other sections, payment details |
| Kitchen | Items to prepare | Prices, payment info |
| Cashier | All orders, payment | Kitchen prep status |
| Manager | Everything | — |

#### The Solution

**Server-enforced, scoped subscriptions**:

```typescript
// Server validates scope even if client lies
ws.send({
  type: 'subscribe',
  channel: 'orders',
  filters: { sectionId: currentUser.sectionId }
});
```

#### Security Layers

1. **API Layer**: Validate every request against permissions
2. **WebSocket Layer**: Only broadcast what user can see
3. **Client Layer**: Filters are UX, not security

#### Key Questions to Answer

-  What permission model? (RBAC, ABAC, custom)
-  Where enforced? (Server, always)
-  How do permissions affect hydration?

</details>
