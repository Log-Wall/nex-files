---
title: API reference
description: Public callable namespaces exposed by nexSys4.
---

# API reference

Functions are grouped by domain under `nexSys.api`. Reads and mutations for a
domain live together; data snapshots remain under `nexSys.state`.

## Domains

| Namespace | Purpose | Representative methods |
| --- | --- | --- |
| `api.affs` | Affliction queries, timing, and priorities | `have`, `haveAll`, `timing`, `setPriority`, `setDefaultPriority` |
| `api.defs` | Defence queries, priorities, and defup | `have`, `setPriority`, `setStatic`, `defup`, `defoff`, `parry` |
| `api.balances` | Balance queries and timing | `have`, `haveAny`, `elapsedMs`, `remainingMs`, `timing` |
| `api.limbs` | Limb lookup | `get`, `list` |
| `api.target` | Current target | `get`, `set`, `is` |
| `api.class` | Character class checks | `get`, `is`, `check` |
| `api.command` | Command dispatch and output-cycle work | `send`, `sendInline`, `addOutput`, `evaluateNow` |
| `api.control` | Runtime and persisted settings | `pause`, `unpause`, `setSlowMode`, `applySettings`, `start`, `stop` |
| `api.queue` | Named command queues | `list`, `inspect`, `get`, `add`, `prepend`, `clearQueue`, `flush` |
| `api.prompt` | Prompt rendering and customization | `set`, `reset`, `updateVars`, `updateAffs`, `updateCureColors` |
| `api.observe` | Explicit observed state transitions | Affliction, defence, balance, limb, and mount handles |
| `api.ui` | Configuration dialog | `openConfig`, `closeConfig`, `setConfigOpen` |
| `api.line` | Nexus output-line helpers | `replace`, `replaceHTML`, `nextLine`, `prependNotice`, `say` |
| `api.rules` | Runtime rule lifecycle | `add`, `remove`, `enable`, `load`, `reorder`, `bindTransition` |
| `api.ss` | Server-side-only constructs | Predictions, manual queue, precache, prioritized affliction, and snapshot sync |

## Common patterns

```js
// Query a domain
nexSys.api.affs.have("asthma");
nexSys.api.balances.timing("balance");

// Request a mutation
nexSys.api.affs.setPriority("asthma", 5);
nexSys.api.defs.defup();

// Send commands and use a named queue
nexSys.api.command.send("stand");
nexSys.api.command.send("block troll", true); // bypass Nexus alias expansion
nexSys.api.queue.free.add("touch tree");

// Update target state through the supported path
nexSys.api.target.set("sarapis");
```

## Return values

Predicate methods return booleans. Timing and lookup methods may return `null`
when an id is unknown. Mutation methods commonly return whether a change was
made or a domain-specific result object. Callers should not assume that every
mutation is synchronous server confirmation; use state and events to observe
the confirmed result.

## Events are separate

Listeners do not live below `api`. External packages attach listeners through
the Nexus `eventStream` global. The [events page](./events.md) lists every
nexSys4 event available through that interface.
