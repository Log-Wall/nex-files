---
title: Areas
description: The area model — targets, NPC flags, and discovery.
---

# Areas

An **area** is everything nexBash needs to grind one place: which mobs to fight,
in what order, and how to behave while there. nexBash ships a
library of area definitions and selects the right one from your location.

## What an area holds

| Field | Meaning |
| --- | --- |
| `name` / `id` | Area identity (a scalar or a list of IRE area names/ids). |
| `npcs` | A map of NPC name → combat-flag definition (`canShield`, `shouldCC`, `canWeb`, `totalHp`, …). |
| `areaTargets` | The ordered target priority list (defaults to the `npcs` keys). |
| `avoidTargets` | NPC names whose presence makes nexBash skip the room. |
| `targetThreshold` | Maximum targets in a room before moving on (default 5). |
| `stepDelay` / `startRoom` | Optional pacing and entry-room hints. |
| `onEnter` / `onExit` | Area lifecycle hooks (register/clean area-scoped triggers, rules, events). |

Configure targets and NPC flags in the
[Area Configuration](./configuration/area-configuration.md) tab.

## Selecting an area

nexBash matches your current `GMCP.Location` to a registered area and makes it
live. This happens automatically on area change (it listens for the nexMap
area-change event), and on `nb start`:

- `nb start` resolves the area for your location, makes it live, and begins.
- `nb clear` reloads the current area and restarts — use it after editing targets.

The live area is always an **owned clone** of the definition, never the shared
definition itself. Per-room combat mutations (a user-added target, discovered
damage data, lifecycle flags) live on the clone, so they can never leak back into
the shipped definition or a sibling area.

## Combat Loop

While a run is live, the bash machine drives a loop: scan the room, check whether it is contested by non-party players, build and rank the target list, and fight until clear.

If you move to a new room (by walking or using a separate pathing command), nexBash detects the room change, scans the new room, and automatically resumes combat if valid targets are present.

## Adding your own area and targets

You can build area data live from the command line:

```text
nb addarea               # register the current GMCP area as a new, empty area
nb addnpc a cave troll   # add an NPC target to the active area (exact name)
```

`nb addarea` persists the new area and makes it live. `nb addnpc` adds to the live
area and, when the area is registered, persists the change too. Both keep the
area's derived lookup caches consistent.

Packages that build areas programmatically (for example quest areas) can hand a
ready-made `Area` instance to nexBash:

```js
const area = new nexBash.classes.Area({ id, name, npcs, areaTargets });
nexBash.api.config.setArea(area); // runs the full enter/exit lifecycle
```

Areas passed this way are ephemeral — they are made live but not added to
`nexBash.areas`.

## Discovery

As nexBash fights, class strategies that probe (for example Magi) record observed
damage ranges for each mob and damage type. Discoveries are de-duplicated per
run and reported when the run ends so you can vet the data before editing NPC
flags such as resistances. See [Session & automations](./session-and-automations.md).
