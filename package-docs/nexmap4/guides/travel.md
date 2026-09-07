---
title: Travel and pathing
description: How nexMap4 routes, executes routes, and applies travel classes.
---

# Travel and pathing

nexMap4 routing is built around **one computed route and two execution modes**.
A single shortest-path query produces a route; that route is then compiled into
either batched server commands or one-command-per-room client steps, depending
on your settings.

## Destinations

Every travel entry point resolves to a room on the graph:

```js
nexMap.api.travel.toRoom(315);        // a concrete room id
nexMap.api.travel.toArea(42);         // nearest reachable room in an area
nexMap.api.travel.toLandmark("home"); // a saved landmark
nexMap.api.travel.goto("Delos");      // a room id, landmark, or area name
nexMap.api.travel.stop();             // stop the active route
```

`goto` is the universal entry point — it accepts the same forms as `nm goto`
and figures out whether the argument is a room id, a landmark, or an area name.
Clicking a room on the map is equivalent to `toRoom`.

## Planning without moving

`planRoute` computes a route synchronously and returns it **without** executing.
This is pure and deterministic — no GMCP reads, no side effects — so it is safe
to call repeatedly:

```js
const plan = nexMap.api.travel.planRoute(315);
// { commands, rooms, segments, totalWeight, sourceRoomId, targetRoomId } | null
```

A `null` result means no route exists under the current travel-class and
exclusion settings.

## Execution modes

The active mode is the **Pathing Mode** setting on the
[Pathing & Travel tab](./configuration/pathing-travel.md).

| Mode | Behavior |
| --- | --- |
| **Hybrid Track** (`hybridTrack`) | Uses Achaea's `path track` to batch eligible segments server-side. Fewer round-trips; the default. |
| **Client Step** (`clientStep`) | Sends one command per room from the client, preserving room-by-room automation hooks (arrival callbacks). |

Both modes execute the *same* computed route — only how the commands are
delivered differs.

## Travel classes

Beyond plain walking, the graph models special-travel edges. Optional edge types
are **travel classes** that can be enabled or disabled; a disabled class is
pruned from pathfinding (its edges are given infinite weight at query time).
Core travel classes such as `nurRift` are always available and are not
configuration toggles.

| Travel class | Notes |
| --- | --- |
| `eagleWings` | Low clouds. |
| `atavianWings` | High clouds. |
| `islandWings` | Island wing travel. |
| `wormhole` | Remote wormhole edges (see below). |
| `sewergrate` | Sewer-grate travel. |
| `airHarness` | Air-harness travel. |
| `universe` | Universe travel. |
| `knocker` | Knocker travel. |
| `gare` | Gare travel. |
| `urn` | Urn travel. |
| `hourglass` | Touches the hourglass to reach room `68155` after a 10-second channel. Available from Mainland and Meropis locations. |
| `pebble` | Pebble travel. |
| `nurRift` | Nur rift travel. Always available; not configurable. |

Most optional classes are **disabled by default** — enable the ones your
character can actually use, either in the dialog or with a toggle:

```js
nexMap.api.travel.enable("clouds");      // eagleWings + atavianWings
nexMap.api.travel.disable("wormholes");
nexMap.api.travel.toggle("universe");
nexMap.api.travel.enable("hourglass");
nexMap.api.travel.isEnabled("wormholes");
```

### Aliases

The toggles accept friendly aliases so you don't have to type internal class
names:

| Alias | Expands to |
| --- | --- |
| `clouds` | `eagleWings` + `atavianWings` |
| `lowclouds` | `eagleWings` |
| `highclouds` | `atavianWings` |
| `wings` | `eagleWings` + `atavianWings` + `islandWings` |
| `grates` / `sewergrates` | `sewergrate` |
| `wormholes` | `wormhole` |

### Travel commands

Travel commands can be customized on the Pathing & Travel tab. The wing
defaults match Achaea's standard phrases, while the hourglass can use a
separator-delimited retrieval sequence when it is stored in a container:

| Class | Default command |
| --- | --- |
| `eagleWings` | `say duanathar` |
| `atavianWings` | `say duanatharan` |
| `islandWings` | `say duanatharic` |
| `hourglass` | `touch hourglass` |

## Wormholes

Wormhole edges come from a remote service and from any custom wormholes you add.
They participate in pathing only when the `wormhole` class is enabled.

```js
nexMap.api.wormholes.list();
nexMap.api.wormholes.refresh();                              // reload from the service
nexMap.api.wormholes.add({ sourceRoomId: 4270, targetRoomId: 328 });
nexMap.api.wormholes.remove(4270);
nexMap.api.wormholes.probe();                                // arm the probe parser
```

## Excluding rooms and cities

Pathing avoids any room in the **excluded rooms** set. The
[City Lockouts tab](./configuration/city-lockouts.md) is the friendly front end
for this — selecting a city excludes its gate rooms so routes never pass through
a hostile city. You can also exclude arbitrary room ids directly.

## Celerity

The **Celerity** setting (1–5) is a movement-cost multiplier applied when
celerity is active — higher values model a faster effective walking speed and
bias the route accordingly.
