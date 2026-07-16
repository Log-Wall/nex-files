---
title: Options & settings
description: Global options, battlerage reserves, and the self-healing persisted settings document.
---

# Options & settings

For the dialog walkthrough, see the
[Options guide](../guides/configuration/options.md).

## Global option flags

`nexBash.options` holds global booleans. Defaults shown:

| Flag | Default | Effect |
| --- | --- | --- |
| `notices` | `true` | Show status and command notices in the client. |
| `rageToRaze` | `true` | Allow battlerage to raze a target's shield. |
| `skipNonPartyRooms` | `true` | Move on when an unclaimed room contains players outside your party. |
| `swapOnShield` | `true` | Switch to another valid target when the current target raises a shield. |
| `useMorimbuul` | `false` | Draw morimbuul before engaging mobs that can web. |
| `logging` | `false` | Emit additional diagnostic output; not shown in the dialog. |

These values enter the decision context as `ctx.config.*`. They are global player
options, not strategy-profile args.

## Battlerage reserves

`nexBash.config.battlerage` holds static rage buffers:

| Buffer | Default | Meaning |
| --- | --- | --- |
| `shieldBuffer` | `17` | Rage kept available for a shield raze. |
| `ccBuffer` | `35` | Rage kept available for crowd control. |
| `generalBuffer` | `48` | General reserve before ordinary battlerage spending. |

The live battlerage-balance flag is runtime state. The context adapter composes it
with these buffers into `ctx.battlerage` each tick. See
[Battlerage](../guides/battlerage.md).

## Persisted settings document

Settings live at
`nexusclient.variables().vars.nexBash4Settings`. The current document is strict
schema **v3**:

```jsonc
{
  "schemaVersion": 3,
  "updatedAt": "2026-07-11T12:00:00.000Z",
  "options": {
    "notices": true,
    "rageToRaze": true,
    "skipNonPartyRooms": true,
    "swapOnShield": true,
    "useMorimbuul": false,
    "logging": false
  },
  "battlerage": {
    "shieldBuffer": 17,
    "ccBuffer": 35,
    "generalBuffer": 48
  },
  "areas": {
    "id:137": {
      "areaKey": "id:137",
      "id": 137,
      "name": "Tuar",
      "areaTargets": ["a tuar warrior", "a tuar shaman"],
      "npcs": {
        "a tuar shaman": { "canShield": true, "shouldCC": true }
      }
    }
  },
  "strategies": {
    "depthswalker": {
      "activeProfile": "group",
      "profiles": {
        "group": {
          "order": {
            "primary": ["general.flee", "depthswalker.strike", "depthswalker.reap"]
          },
          "args": {
            "daggerId": "59237",
            "scytheId": "330399"
          },
          "actionArgs": {
            "general.flee": { "hp": 0.25 }
          }
        }
      }
    }
  }
}
```

The snapshot is minimal: default-equal values, empty profile maps, and
default-only classes are omitted. `activeProfile` is omitted when `default` is
active.

### Per-area fields

| Field | Meaning |
| --- | --- |
| `areaKey` | Stable identity derived from area ID or name. |
| `id` / `name` | Scalar or list area identity. |
| `areaTargets` | Ordered target names. |
| `avoidTargets` | NPC names whose presence makes nexBash skip the room. |
| `npcs` | Per-NPC combat overrides. See [Area Configuration](../guides/configuration/area-configuration.md). |
| `targetThreshold` | Maximum targets before moving on. |
| `route` / `stepDelay` / `startRoom` | Optional route, pacing, and entry-room data. |

### Per-strategy fields

A class entry is `{ activeProfile?, profiles }`. Every profile is a sparse delta
over shipped defaults:

| Delta field | Meaning |
| --- | --- |
| `order` | Full ordered catalog keys for each changed lane. Order is also membership. |
| `args` | Strategy-scoped string, number, or boolean overrides. |
| `actionArgs` | Action-local primitive overrides keyed by catalog key and argument name. |

No `params`, legacy per-action `args`, or class `config` aliases exist in the
current runtime, draft, or saved shape.

## Self-healing load boundary

The Nexus variable is untrusted and user-editable. Loading therefore uses two
layers:

1. A pure stored-input healer recognizes older or loose data one independent
   section at a time.
2. The result must pass the one strict current v3 Zod schema before it is applied.

The healer can:

- coerce deliberately tolerated booleans such as `0` / `1`;
- normalize scalar/list area fields and recover valid NPC overrides;
- fold an older flat strategy delta into the `default` profile;
- move the prior strategy `params` scope to current `args`;
- move prior nested per-action `args` to `actionArgs`;
- preserve valid options, battlerage, areas, or strategies when a sibling section
  is malformed; and
- discard unknown or irreconcilable fields.

Legacy names stop at this I/O boundary. Zustand, runtime strategies, selection,
and components know only v3.

## Canonical rewrite

After healed settings are applied, nexBash builds a normal snapshot from the live
owners and validates it against the strict current schema. If the original stored
document is not equivalent to that canonical snapshot, it is replaced
immediately. Comparison ignores the intentionally refreshed `updatedAt` field, so
an already-canonical document is not rewritten on every startup.

As with normal saves, writes are deliberately suppressed while the procedural
Mnemosyne area is active.

This makes healing convergent and idempotent: after one successful load, storage
uses the same current shape that a normal save emits.
