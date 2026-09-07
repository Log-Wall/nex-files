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
| `gameName` / `gameId` | Area identity (a scalar or a list of IRE area names/ids). |
| `npcs` | A map of NPC name → combat facts (`aggro`, `canAssist`, `assistGroup`, `ccMinAttackers`, `threatLevel`, `canShield`, `totalHp`, …). |
| `areaTargets` | The ordered target priority list (defaults to the `npcs` keys). |
| `avoidTargets` | NPC names whose presence makes nexBash skip the room. |
| `maxAttackers` | Maximum projected attackers nexBash may engage (default 5). |
| `stepDelay` / `startRoom` | Optional pacing and entry-room hints. |
| `setup(area, scope)` | Optional trusted package setup for scoped triggers, rules, and events. |
| `automations` | Persisted command actions run on activation or deactivation. |

Configure targets and NPC flags in the
[Area Configuration](./configuration/area-configuration.md) tab.

## Projected attackers

Room population and attackers are different facts. nexBash tracks the exact
GMCP IDs already expected to be attacking, then projects what each proposed
action would add:

- a directly attacked NPC is an attacker;
- every present NPC with `aggro: true` is an attacker;
- `canAssist: true` with no `assistGroup` defends any directly attacked NPC;
- a grouped assistant defends only a direct target with the same explicit
  `assistGroup`;
- `groupName` is unrelated display/squint metadata.

An action is legal only when the complete projected set is within
`area.maxAttackers`. Selection searches past unsafe high-priority candidates, so
an unsafe first target does not make nexBash abandon a room when a later target
is safe. Shield swaps, coupled rage plus primary attacks, autonomous rage, and
fixed-size AoE all use the same projection.

`ccMinAttackers` separately controls crowd control. `0` disables CC for that NPC;
otherwise CC is eligible when the current attacker count reaches the configured
minimum.

## Focus threats

`maxAttackers` is a count, and a count cannot say that one particular denizen is
worth more attention than the rest of the room combined. `threatLevel` does.

A non-negative integer on the NPC, `0` by default. Any positive value declares:
*this denizen must be eliminated before attention is divided.* It does two
things, and they work as a pair:

- **It sorts first.** Target selection ranks the highest `threatLevel` above
  every live combat fact, so the threat is picked before a wounded or
  lower-priority mob. Within one threat tier nothing changes: shielded last,
  then lowest HP, then the area's declaration order.
- **It blocks multi-target attacks.** While such an NPC is present and
  attackable, nexBash refuses every multi-target attack — a Magi will not
  Stormhammer past a boss and will keep hitting single targets until it is dead.
  A shielded focus threat still counts; a shield is not an elimination.

The second rule needs the first. On its own it would suppress AoE forever,
because nothing would push selection onto the threat whose death lifts the
suppression. Together they read as one behaviour: kill the dangerous thing
first, then the room opens back up.

This is a separate axis from `ccMinAttackers` on purpose, even though the two
usually travel together. `ccMinAttackers` answers *"is controlling this worth the
rage right now?"* and is player-tunable; `threatLevel` answers *"is this thing
dangerous enough that I must not split my damage?"* and is a fixed fact about the
denizen. It is code-authored only — it has no config-UI control and is not stored
as a per-player override, so trimming a rage budget can never quietly re-enable a
multi-target attack next to something lethal.

Examples:

- Tuar uses a permissive cap (`99`) because the non-assisting Nelbennir can be
  swapped or multi-targeted efficiently.
- Mannamot uses `maxAttackers: 1`; greater elementals do not assist, while any
  represented lesser-elemental helpers share the explicit
  `mannamot-lessers` group.
- A universal-assist room marks only confirmed helpers with
  `canAssist: true` and leaves `assistGroup` null.
- An NPC with `ccMinAttackers: 2` is controlled only once at least two attackers
  are engaged.

## Selecting an area

nexBash matches your current `GMCP.Location` to a registered area and makes it
live. This happens automatically on area change (it listens for the nexMap
area-change event), and on `nb start`:

- `nb start` resolves the area for your location, makes it live, and begins.
- `nb clear` explicitly deactivates and reloads the current area, then restarts —
  use it after editing targets or lifecycle automations.
- Entering an unsupported area deactivates the old area, leaves
  `nexBash.area` as `null`, and stops a live run; resources and combat never
  leak from the previous location.

When an area is active, it is always an **owned clone** of the definition, never
the shared definition itself. Per-room combat mutations (a user-added target,
discovered damage data, lifecycle flags) live on the clone, so they can never
leak back into the shipped definition or a sibling area.

## Custom behavior at area boundaries

Use the extension surface that matches who owns the behavior:

1. In the config dialog, add command-only **On activation** or **On
   deactivation** automations. They are validated, persisted per area, and run
   at the matching lifecycle edge.
2. An external package subscribes to the semantic EventStream topics
   `nexbash4.area.activated` and `nexbash4.area.deactivated`. This keeps the
   package's code and cleanup under that package's ownership.
3. A shipped, code-authored area may provide `setup(area, scope)` when it must
   install low-level triggers, rules, or listeners. Register each resource with
   the supplied scope; it is disposed exactly when that activation ends.

For example, an external package can attach enter/exit behavior without
modifying the Area definition:

```js
const tags = ["my-package"];

eventStream.registerEvent(
  "nexbash4.area.activated",
  ({ area, reason }) => {
    if (area?.key === "id:207") console.log("Entered Tuar", reason);
  },
  { id: "my-package:tuar-enter", tags },
);

eventStream.registerEvent(
  "nexbash4.area.deactivated",
  ({ area, nextArea, reason }) => {
    if (area?.key === "id:207") console.log("Left Tuar", nextArea, reason);
  },
  { id: "my-package:tuar-exit", tags },
);

// When your package unloads:
eventStream.removeByTag(tags);
```

Lifecycle payloads contain frozen identity descriptors, not mutable live Area
instances. See the [event contract](../reference/events.md#area-lifecycle) for
the complete payload and ordering.

Code-authored area setup receives the narrower resource API:

```js
const area = new nexBash.classes.Area({
  gameId: 207,
  gameName: "the Island of Tuar",
  setup(_area, scope) {
    scope.registerEvent("my-package.signal", handleSignal, {
      id: "nexBash:tuar:signal",
    });
    scope.addTrigger({ name: "Tuar marker", pattern, action });
    scope.loadRules("tuar", rules);
    return () => releaseAnyOtherResource();
  },
});
```

The scope records exact listener, trigger, and rule-pack identities and disposes
them in reverse order. Do not remove shared tags from area setup.

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

Packages that build areas programmatically can hand a ready-made `Area` instance
to nexBash:

```js
const area = new nexBash.classes.Area({ gameId, gameName, npcs, areaTargets });
nexBash.api.config.setArea(area); // runs the full enter/exit lifecycle
```

Areas passed this way are ephemeral — they are made live but not added to
`nexBash.areas`.

A provider with a complete, authoritative area definition can register it
without activating it:

```js
nexBash.api.config.registerArea(area, { replace: false });
```

Registered areas participate in normal location resolution and can also supply
richer NPC metadata to an [owned hunt session](../reference/api.md#apihunt).
Configured metadata is preferred, while an unconfigured requested target uses
the standard `Npc` defaults only on the session's transient area clone. Those
defaults are not added to the registered definition or persisted settings.

## Discovery

As nexBash fights, class strategies that probe (for example Magi) record observed
damage ranges for each mob and damage type. Discoveries are de-duplicated per
run and reported when the run ends so you can vet the data before editing NPC
flags such as resistances. See [Session & automations](./session-and-automations.md).
