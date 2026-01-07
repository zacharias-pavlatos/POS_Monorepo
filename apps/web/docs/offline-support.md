## Offline Support
Picture this: the restaurant's WiFi drops for 30 seconds during peak hours. Without offline support, every action fails, orders get lost, and chaos ensues. Offline support means queueing mutations locally (usually in IndexedDB) when there's no connection, then replaying them once connectivity returns. The client continues working as if nothing happened — waiters can still take orders, add items. The complexity comes from the replay: 
what if the data changed on the server while you were offline? 
What if another waiter modified the same order? 
You need to persist not just the queue but enough context to resolve conflicts when you reconnect.


<details>

#### The Solution

Queue mutations locally (IndexedDB) when offline, replay on reconnect:

```
┌───────────────────────────────────────────────────────┐
│                    Client                             │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────┐   │
│  │   UI State  │───►│  Mutation   │───►│ IndexedDB│   │
│  │  (Zustand)  │    │    Queue    │    │  (Queue) │   │
│  └─────────────┘    └──────┬──────┘    └──────────┘   │
│                            │                          │
│                     ┌──────▼──────┐                   │
│                     │   Online?   │                   │
│                     └──────┬──────┘                   │
└────────────────────────────┼──────────────────────────┘
                             │ Yes
                             ▼
                       ┌───────────┐
                       │  Server   │
                       └───────────┘
```

#### The Challenge

Replay complexity:
- Server state changed while offline
- Another waiter modified same order
- Queued mutation now invalid (item out of stock)

#### Key Questions to Answer

-  How long can your app function offline?
-  What mutations can queue vs must fail?
-  How do you communicate offline status?



</details>
