---
title: API reference
description: Public callable namespaces exposed by nexMap4.
---

# API reference

Functions are grouped by domain under `nexMap.api`. Most methods are thin,
documented wrappers over the [command surface](#the-command-surface): they
dispatch a command by id and return its result. Data snapshots remain under
[`nexMap.state`](./state.md); persisted options live under
[`nexMap.settings`](../guides/configuration/index.md).

## Domains

| Namespace | Purpose | Representative methods |
| --- | --- | --- |
| `api.travel` | Routing and travel-class toggles | `goto`, `toRoom`, `toArea`, `toLandmark`, `stop`, `planRoute`, `enable`, `disable`, `toggle`, `isEnabled` |
| `api.map` | Map viewport and room reads | `showRoom`, `selectRoom`, `showArea`, `center`, `fit`, `zoom`, `refresh`, `roomInfo`, `getNode`, `getOutgoingEdges` |
| `api.landmarks` | Saved landmarks | `add`, `list`, `remove` |
| `api.search` | Graph + denizen search | `rooms`, `area`, `areas`, `gameArea`, `denizens` |
| `api.tracking` | Live subject overlays | `subject`, `clear`, `list` |
| `api.intel` | Farsee / fullsense overlays | `farsee`, `farseeArea`, `fullsense` |
| `api.wormholes` | Remote wormhole edges | `list`, `refresh`, `add`, `remove`, `probe` |
| `api.overlays` | Arbitrary per-room badges/halos | `set`, `clear` |
| `api.system` | Dialogs and notices | `openSettings`, `closeSettings`, `openShell`, `closeShell`, `notice`, `showResults`, `closeResults` |
| `api.commands` | Raw command dispatch | `execute`, `get`, `list`, `menu`, `parseAndExecute`, `version` |

## Common patterns

```js
// Travel
nexMap.api.travel.goto("315");        // room id, landmark, or area name
nexMap.api.travel.toArea(42);         // nearest reachable room in an area
nexMap.api.travel.toLandmark("home");
nexMap.api.travel.stop();

// Plan without executing (synchronous, deterministic)
const plan = nexMap.api.travel.planRoute(315);
// → { commands, rooms, segments, totalWeight, sourceRoomId, targetRoomId } | null

// Map viewport
nexMap.api.map.showArea(42, { fit: true });
nexMap.api.map.zoom(1.5);
nexMap.api.map.getNode(315);          // read a room record, no I/O
nexMap.api.map.getOutgoingEdges(315); // read live materialized adjacency, no I/O

// Landmarks
nexMap.api.landmarks.add("home");
nexMap.api.landmarks.remove("home");

// Search
nexMap.api.search.rooms("temple", { showResults: true });
nexMap.api.search.denizens("Orinula", { showResults: true });
```

## Map topology reads

`api.map.getNode(roomId)` returns the canonical frozen room record, including its
raw charted `exits`. `api.map.getOutgoingEdges(roomId)` returns the canonical
materialized runtime edges leaving that room, including provisional observed
topology such as Mnemosyne sonar edges. Both calls are synchronous and accept
numeric or synthetic room ids; `getOutgoingEdges` returns `[]` when the room is
unknown or has no outgoing edges.

The edge list is a point-in-time caller-owned array whose entries are frozen
canonical records. Query it again after runtime topology changes.

## Travel-class toggles

Fast-travel methods are persisted options, not per-call flags. The travel
namespace edits them through `nexMap.settings`:

```js
nexMap.api.travel.disable("wormholes");      // accepts aliases (clouds, wings, grates…)
nexMap.api.travel.enable("clouds");          // eagleWings + atavianWings
nexMap.api.travel.toggle("universe");
nexMap.api.travel.isEnabled("wormholes");    // → boolean
```

Disabled classes are pruned from pathfinding (their edges get infinite weight).
See [Travel](../guides/travel.md) for the class list and aliases.

## The command surface

Every domain method ultimately dispatches a command id (for example
`travel.toRoom`, `map.showArea`, `landmark.add`). You can call commands directly
when you need an id that has no dedicated wrapper, or to build menus:

```js
nexMap.api.commands.execute("map.showArea", { areaId: 42 }, options);
nexMap.api.commands.get("travel.toRoom");    // metadata for one command
nexMap.api.commands.list();                  // all command metadata
nexMap.api.commands.menu();                  // grouped menu structure
nexMap.api.commands.version;                 // command-surface contract version
```

`parseAndExecute` parses a raw `nm`-style string and runs the routed command —
the same path the in-client `nm` aliases take:

```js
nexMap.api.commands.parseAndExecute("goto 315");
nexMap.api.commands.parseAndExecute("wormholes on");
```

Unknown-but-newer command ids degrade to a friendly "update nexMap4" notice
rather than throwing, so a stale install never hard-fails on a command it
doesn't yet know.

## Return values and async

- Read/predicate methods (`getNode`, `getOutgoingEdges`, `isEnabled`, …) return synchronously.
- `planRoute` is guaranteed synchronous and returns a frozen plan or `null`.
- Travel and search methods that touch the renderer or remote services may
  return a result object or a promise; do not assume a mutation is confirmed
  synchronously. Use [`nexMap.state`](./state.md) and the
  [event surfaces](./events.md) to observe the confirmed result.

## Overlays

`api.overlays.set(key, overlay)` paints a keyed layer of per-room badges or
halos; re-painting the full set under the same key replaces the prior layer, so
no separate clear step is needed each cycle. `api.overlays.clear(key)` removes
one layer (or all layers when called with no key). Both return `false` when no
renderer is connected.

## Connecting renderer clicks

`nexMap.connectRendererActions(options)` binds map room-clicks to a command —
by default `travel.toRoom`, so clicking a room walks there. Pass a different
`commandId` / `createInput` to repurpose clicks (for example, "select room"
instead of "travel").
