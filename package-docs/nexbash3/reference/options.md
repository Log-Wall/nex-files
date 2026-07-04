---
title: Options & settings
description: Player option flags, battlerage reserves, and the persisted settings document.
---

# Options & settings

This page documents the player-tunable values and the on-disk settings shape. For
the in-dialog walkthrough see the [Options tab guide](../guides/configuration/options.md).

## Option flags

`nexBash.options` holds the global boolean toggles. Defaults shown:

| Flag | Default | Effect |
| --- | --- | --- |
| `notices` | `true` | Show nexBash status notices (target swaps, area-cleared, `nb` output) in the client. |
| `rageToRaze` | `true` | Spend battlerage to raze a target's shield instead of waiting it out. |
| `skipNonPartyRooms` | `true` | Move on instead of attacking when an unclaimed room already contains players outside your party. |
| `swapOnShield` | `true` | When the current target raises a shield, switch to another valid target. |
| `useMorimbuul` | `false` | Draw morimbuul before engaging mobs that can web you. |
| `logging` | `false` | Emit additional diagnostic log output. Dev-only; not surfaced in the dialog. |

These flow into the per-tick decision context as `ctx.config.*`, so actions read
them through the same gate they read everything else.

## Battlerage reserves

`nexBash.config.battlerage` holds the rage buffers — how much rage to keep in
reserve before a category of battlerage is allowed to spend. Defaults shown:

| Buffer | Default | Meaning |
| --- | --- | --- |
| `shieldBuffer` | `17` | Rage kept available for a shield raze. |
| `ccBuffer` | `35` | Rage kept available for a crowd-control rage. |
| `generalBuffer` | `48` | Rage kept available for general battlerage. |

The live "on battlerage balance" flag is runtime state, not config; the buffers
above are composed with it into `ctx.battlerage` each tick. See
[Battlerage](../guides/battlerage.md).

## Persisted settings document

Settings live in the Nexus client variable store at
`nexusclient.variables().vars.nexBash4Settings`. This is untrusted, user-editable
JSON, so loading is a trust boundary: every load parses the blob through a Zod
schema (tolerating loose forms — `0`/`1` for booleans, a scalar where a list is
expected) and every save validates before writing, so a successful save always
round-trips to a successful load.

Current shape (`schemaVersion` 2):

```jsonc
{
  "schemaVersion": 2,
  "updatedAt": "2026-06-25T12:00:00.000Z",
  "options": { "notices": true, "rageToRaze": true, "skipNonPartyRooms": true, "swapOnShield": true, "useMorimbuul": false },
  "battlerage": { "shieldBuffer": 17, "ccBuffer": 35, "generalBuffer": 48 },
  "areas": {
    // keyed by a stable areaKey derived from id (or name)
    "id:137": {
      "areaKey": "id:137",
      "id": 137,
      "name": "Tuar",
      "areaTargets": ["a tuar warrior", "a tuar shaman"],
      "npcs": { "a tuar shaman": { "canShield": true, "shouldCC": true } }
    }
  },
  "strategies": {
    // keyed by class id; each entry is a profile set (FEAT-05)
    "magi": {
      "activeProfile": "group",
      "profiles": {
        "default": {},
        "group": { "order": { "primary": ["magi.stormhammer", "magi.erode"] } }
      }
    }
  }
}
```

The snapshot is kept **minimal**: default-equal values, empty profile maps, and
default-only classes are omitted, and `activeProfile` is omitted when it is the
default. A persisted area entry mirrors the editable `AreaSettings` shape so the
same schema validates a config-dialog draft.

### Per-area fields

| Field | Meaning |
| --- | --- |
| `id` / `name` | Area identity (scalar or list); `areaKey` is derived from these. |
| `areaTargets` | Ordered NPC names (the target priority list). |
| `avoidTargets` | NPC names whose presence makes nexBash skip the room. |
| `npcs` | Per-NPC combat-flag overrides (see [Area Configuration](../guides/configuration/area-configuration.md)). |
| `targetThreshold` | Max targets in a room before moving on. |
| `stepDelay` / `startRoom` | Optional pacing and entry-room hints. |

### Per-strategy fields

A class entry is `{ activeProfile?, profiles }`, where each profile is a sparse
**delta** over the shipped class defaults:

| Delta field | Meaning |
| --- | --- |
| `order` | Per-lane full ordered catalog keys, present only when the lane differs from the shipped default. The order *is* the membership. |
| `params` | Per-class config-knob overrides. |
| `args` | Per-action tuning overrides, keyed by catalog key then param. |

A legacy v1 flat delta is tolerantly folded into
`{ profiles: { default: <delta> } }` on load. See
[Strategies](../guides/strategies.md) and [Profiles](../guides/profiles.md).

## Migrations

The schema version is bumped only for shape changes, and the loader tolerates the
prior shape where practical (the v1→v2 profile fold above). Because nexBash is
pre-release with no installed user base, settings are not otherwise migrated.
