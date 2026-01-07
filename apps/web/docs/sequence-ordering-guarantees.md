## Sequence / Ordering Guarantees
If a waiter adds three items rapidly, they must arrive at the server in order and be applied in order. If item 2 arrives before item 1 due to network quirks, your order might be corrupted. You need either sequential processing (wait for each mutation to confirm before sending the next) or sequence numbers that let the server reorder. This is especially critical for operations that depend on prior state — you can't add a modifier to an item that doesn't exist yet.


<details>

#### The Problem

Network doesn't guarantee order:

```
Waiter taps rapidly:     Server receives:
1. Add Burger            1. Add Drink     ← Arrived first
2. Add Fries             2. Add Burger
3. Add Drink             3. Add Fries
```

For independent operations, fine. For dependent operations:

```
❌ PROBLEM
1. Add modifier to item #5  ← Arrives first
2. Create item #5           ← Arrives second

Server: "What is item #5??"
```

#### Solutions

| Approach | Tradeoff |
|----------|----------|
| **Sequential Processing** | Slower, guaranteed order |
| **Sequence Numbers** | Faster, more complex |
| **Dependency Declaration** | Most flexible, most complex |

#### POS Recommendation

Sequential for dependent, parallel for independent:

```typescript
// Independent: parallel
await Promise.all([
  addItem(orderId, 'burger'),
  addItem(orderId, 'fries'),
]);

// Dependent: sequential
const item = await addItem(orderId, 'burger');
await addModifier(item.id, 'no-onions');
```

#### Key Questions to Answer

-  Which operations have dependencies?
-  Sequential or sequence numbers?
-  How handle out-of-order arrivals?

</details>
