---
title: The decision model
description: How nexBash4 chooses what to do each prompt using lanes, gates, and explicit tuning.
---

# The decision model

Everything nexBash does in combat comes down to one idea: on each game prompt it
walks a **priority lane** top-to-bottom and uses the **first action that is legal
right now**.

## The pieces

| Piece | What it is |
| --- | --- |
| **Action** | One ability: `{ id, queue, canExecute(ctx, tuning), execute(ctx, tuning), engagementTargets(ctx, tuning) }`. The first and last functions are pure; `execute` returns commands. |
| **Lane** | A curated, ordered list of catalog keys. The order *is* the priority. Strategies have a `primary` lane and usually a `battlerage` lane. |
| **Strategy** | A class expressed as data: its lanes plus optional profile-scoped shared args. See [Strategies](./strategies.md). |
| **Context (`ctx`)** | A fresh per-tick bundle of tactical answers and player-state predicates. |
| **Action tuning** | A precomputed `{ strategy, action }` envelope containing the active profile's two configuration scopes. |
| **Selector** | The first-valid walk over a lane that applies a pure eligibility predicate and produces the chosen action with its tuning. |

## The loop

On every prompt while in combat:

1. nexBash builds one fresh decision context.
2. It walks the active strategy's `primary` lane in order.
3. For each catalog key it reads that key's precomputed tuning and asks
   `canExecute(ctx, tuning)`.
4. The first action that answers `true` wins. Its `execute(ctx, tuning)` receives
   the exact same tuning object and returns the commands to queue.
5. If a coupled battlerage is ready, nexBash selects it through the same keyed
   tuning path and fuses it into the attack command stack.
6. Immediately before queueing, nexBash unions every selected action's exact
   `engagementTargets`, re-projects assistants against the latest room roster,
   and queues only when the result is within `area.maxAttackers`.

Autonomous battlerages run an independent first-valid pass when rage/freerage
state changes. See [Battlerage](./battlerage.md).

Ordinary primary and battlerage candidates use their action's `canExecute`
gate. A cross-action track policy may supply another pure eligibility predicate
to the same first-valid primitive. Maya spending uses this extension because it
deliberately waives ordinary action-local tactical gates; ordering, keyed tuning,
and decision tracing remain centralized rather than being reimplemented.

:::note Execution machine
The prompt and battlerage handlers run within the `combat` state of the core
state machine. See the [Overview](../introduction.md#the-state-machine) for the
complete state chart.
:::

Because selection is a fresh walk each tick, priority is an order of preference,
not a fixed script. A high-priority ability that is not currently legal is passed
over in favor of the next valid one.

## The two tuning scopes

Profile configuration is deliberately separate from the per-tick context. Every
catalog key receives an explicit `ActionTuning` envelope:

```js
{
  strategy: { daggerId: "59237", scytheId: "330399" },
  action: { hp: 0.3 },
}
```

- `tuning.strategy` contains values owned by the whole strategy/profile, such as
  shared equipment identities.
- `tuning.action` contains values owned by one catalog action, such as that
  action's HP threshold.

The scopes may use the same property name without colliding. Actions never read
`nexBash.currentStrategy` to find configuration. When a profile is applied,
nexBash derives immutable tuning objects and keyed lane entries for the effective
lanes. Prompt and rage selection then perform reads over that precomputed state;
they do not merge tuning per candidate. The winning reference is passed unchanged
to execution.

Actions with no declared values still receive stable empty `strategy` and
`action` objects. This keeps the invocation contract uniform without adding work
to the hot path.

## The decision context

`canExecute(ctx, tuning)` is the entire local situational brain of an action, and it is
**pure**: it reads only the context and static tuning, never host globals, and has
no side effects. The context is the adapter that reads nexSys, nexGui, GMCP, and
the target model and turns them into answers.

| Field | Meaning |
| --- | --- |
| `ctx.target` | Active target facts: `id`, `name`, `hp` (0-100%), `totalHp`, `shielded`, `aggro`, `canAssist`, `assistGroup`, `ccMinAttackers`, `threatLevel`, `cc`, `resistances`, `damageTypes`, and `canHeal`. |
| `ctx.hasTarget` / `ctx.targetCount` | Whether a target exists and how many configured mobs are in the room. |
| `ctx.attackerIds` / `ctx.attackerCount` / `ctx.maxAttackers` | Exact current attacker IDs, their count, and the active-area budget. |
| `ctx.aoePlan` / `ctx.aoeTargetIds` | A prepared safe fixed-size AoE projection and its exact IDs, or no plan/IDs when unsafe — including whenever a `threatLevel` denizen is present. |
| `ctx.room.threatLevel` | Highest `threatLevel` among attackable NPCs present; `0` when the room holds no focus threat. Distinct from `ctx.incomingThreat`, which is squint's *adjacent-room* danger scalar. |
| `ctx.party` | Party `members`, `leader`, `size`, `isMember`, and `isLeader`. |
| `ctx.enabled(key)` | Whether a catalog key belongs to an effective lane. |
| `ctx.haveAff` / `ctx.haveAnyAff` / `ctx.haveDef` / `ctx.haveBal` / `ctx.isClass` | Player-state predicates delegated to nexSys4. |
| `ctx.selfHp` / `ctx.selfMana` | Self vitals as 0-1 ratios. |
| `ctx.rage` / `ctx.spark` / `ctx.transcendence` | Class resource pools. |
| `ctx.wielded` | The character's currently wielded items. |
| `ctx.battlerage` | Battlerage balance, live flags, configured buffers, and `razeReady`. |
| `ctx.room` | Environment answers such as `canFly`, `canBurrow`, and `fleeDirection`. |
| `ctx.config` | Global player [options](./configuration/options.md) plus the active area's `maxAttackers`. |

`ctx.config` remains the adapter for global options and active-area facts. It is
not a strategy-profile configuration channel; those values belong in
`ActionTuning`.

A damaging action is rejected before its local gate when the active target
resists the action's damage type.

## The action catalog

Every ability lives in a flat, namespaced catalog, keyed like `magi.erode`,
`battlerage.disintegrate`, or `general.fly`. Lanes reference these keys, and the
configuration bench is drawn from keys available to the selected class.

```js
nexBash.actionCatalog.list({ namespace: "magi" });
nexBash.actionCatalog.get("magi.dissolution");
```

## Where rules fit

nexBash does not use a per-tick rules engine to mutate priorities. Action-local
conditions live in each action's pure gate; cross-action track policies live in
the selection facade as pure eligibility predicates. First-valid resolves both
against the ordered lane. A general rule registry exists as reserved
infrastructure but is not wired into the runtime or public contract.

## Seeing why an action was chosen

A decision trace can record each selection pass for debugging. It is off by
default so the hot path stays free:

```js
nexBash.trace.enable();
// fight for a bit
nexBash.trace.list();
nexBash.trace.disable();
```

You can also subscribe to a live stream with `nexBash.trace.subscribe(fn)`.
