## Conflict Resolution
Two waiters both add an item to the same order at the exact same moment from different tablets. Or one waiter marks an order as paid while another is still adding items to it. These are conflicts — the server receives two mutations that both assume a state that no longer exists. You need a strategy: "last write wins" is simplest (later timestamp overwrites), but it can silently lose data. "Merge" attempts to combine both changes intelligently (both items get added). "Prompt user" surfaces the conflict for manual resolution, but interrupts workflow. For a POS, most conflicts are additive (adding items) and can be auto-merged, but status changes (open → paid) need more careful handling since you can't unpay an order easily.

<details>

#### The Problem

```
Terminal A                    Server                    Terminal B
    │                           │                           │
    │  GET order (v1)           │        GET order (v1)     │
    │◄──────────────────────────┼──────────────────────────►│
    │                           │                           │
    │  Add beer (based on v1)   │    Add wine (based on v1) │
    ├──────────────────────────►│◄──────────────────────────┤
    │                           │                           │
    │           CONFLICT! Which update wins?                │
```

#### Resolution Strategies

| Strategy | How It Works | Best For |
|----------|--------------|----------|
| **Last Write Wins** | Later timestamp overwrites | Simple cases |
| **Merge** | Combine both changes | Additive operations |
| **Reject if Stale** | Require latest version | Critical state changes |
| **Prompt User** | Show conflict for resolution | Edge cases |

#### POS-Specific Guidance

| Operation | Strategy |
|-----------|----------|
| Adding items | **Merge** — both items get added |
| Updating quantity | **Last Write Wins** |
| Status change (open → paid) | **Reject if stale** |
| Voiding order | **Prompt if changed** |

#### Key Questions to Answer

-  Which operations can auto-merge?
-  Which operations require latest-state validation?
-  How do you surface unresolvable conflicts?

</details>
