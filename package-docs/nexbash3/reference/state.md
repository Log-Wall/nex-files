---
title: State reference
description: The read-only nexBash.state snapshot and its branches.
---

# State reference

`nexBash.state` is the read-only data surface. Each read builds a fresh, deeply
frozen plain object from the live runtime owners — it is "safe to inspect and
stringify", not a place to write flags and not a hot-path read.

```js
if (nexBash.state.combat.hasTarget) {
  // react to the current snapshot
}
```

The hot combat decision path does **not** read `state`; it reads a per-tick
decision context built directly over the live owners (see
[the decision model](../guides/decision-model.md)). `state` exists for the config
UI, debug overlays, logging, and integrations.

## Branches

| Branch | Value | Contents |
| --- | --- | --- |
| `state.system` | object | `version`, `enabled` (a run is live). |
| `state.area` | object | Active area `id`, `name`, and `targetThreshold`. |
| `state.strategy` | object | Active class strategy `id` (`null` on an unsupported class). |
| `state.combat` | object | `hasTarget`, the active `target` (`{ id, name }` or `null`), and `targetCount`. |
| `state.session` | object | Per-run scoreboard: `kills`, `gold`, `elapsedMs` (all `0` when no run is active). |
| `state.effects` | object | Transient bashing-effect state: `bloodcloak` and `maya` are booleans (available or not); `deathcape` is `{ available, charges, max }` with a running `0`–`50` charge count. |
| `state.battlerage` | object | `balance` (on battlerage balance) plus the configured `shieldBuffer`, `ccBuffer`, `generalBuffer` reserves. |
| `state.options` | object | A copy of the live player [option flags](./options.md). |

### Example shape

```js
{
  system:   { version: "1.0.0", enabled: true },
  area:     { id: 137, name: "Tuar", targetThreshold: 5 },
  strategy: { id: "magi" },
  combat:   { hasTarget: true, target: { id: 4821, name: "a tuar warrior" }, targetCount: 3 },
  session:  { kills: 18, gold: 2400, elapsedMs: 305000 },
  effects:  { bloodcloak: false, maya: false, deathcape: { available: true, charges: 32, max: 50 } },
  battlerage: { balance: true, shieldBuffer: 17, ccBuffer: 35, generalBuffer: 48 },
  options:  { rageToRaze: true, swapOnShield: true, skipNonPartyRooms: true, useMorimbuul: false, logging: false, notices: true }
}
```

## Serialization contract

The complete state tree is JSON-serializable and contains no function values:

```js
const report = JSON.parse(JSON.stringify(nexBash.state));
```

This is the preferred shape for debug captures and bug reports. The snapshot is
deeply frozen; call a method under `nexBash.api` to request a change.

## Fresh reads

A captured branch does not update in place — every property access on
`nexBash.state` builds a new snapshot. Read the branch again after a transition:

```js
const before = nexBash.state.combat;
// combat progresses…
const after = nexBash.state.combat;
```

Use [events](./events.md) when an integration needs to know *when* to re-read.

## Convenience accessors

A few live values are also exposed directly on the global for quick reads (these
return live references, not frozen copies — treat them as read-only):

| Accessor | Returns |
| --- | --- |
| `nexBash.target` | The active target instance, or the `NO_TARGET` projection. |
| `nexBash.targets` | The live list of room combatants. |
| `nexBash.hasTarget` | Whether an active target exists. |
| `nexBash.area` | The active (cloned) `Area` instance. |
| `nexBash.currentStrategy` | The active class strategy object (`null` if unsupported). |
| `nexBash.supportedClasses` | The class ids nexBash ships a strategy for. |
