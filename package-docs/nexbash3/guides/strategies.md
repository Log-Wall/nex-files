---
title: Strategies
description: The per-class shipped baselines, customization deltas, and how they evolve.
---

# Strategies

A **strategy** is a class's combat baseline expressed as data: its priority lanes
plus a small config object. nexBash ships exactly one strategy per supported class
and selects yours automatically from your in-game class. This page explains what a
strategy contains and how your customizations layer on top of it.

For the moment-to-moment selection a strategy drives, read
[The decision model](./decision-model.md) first.

## What ships

Each shipped strategy is:

- An `id` matching the lowercased class (e.g. `magi`, `red dragon`).
- One or more **lanes** — ordered lists of catalog keys. A `primary` lane and,
  for most classes, a `battlerage` lane.
- A `config` object of class-level bool/int knobs (often empty).
- An optional **ingestion lifecycle** (`activate` / `deactivate`) for the few
  classes that learn facts during combat — for example, Magi registers listeners
  that record each staff cast's observed damage, helping choose a best element
  and giving you low/high damage ranges to review.

The supported set out of the box: **Magi**, **Occultist**, **Red Dragon**, **Blue
Dragon**, **Golden Dragon**, **Fire Lord**. Confirm the live set with `nb help` or
`nexBash.supportedClasses`.

### Example: how a lane reads

Magi's primary lane is ordered defensive-first, then offensive, then the elemental
staff cycle:

```text
general.fly        ┐
general.flee       │ defensive
tattoos.shield     ┘
magi.erode         ┐ offensive
magi.stormhammer   ┘
magi.dissolution   ┐ elemental cycle (magic)
magi.scintilla     │ (fire)
magi.horripilation │ (cold)
magi.lightning     ┘ (electric)
```

Selection walks this top-to-bottom each prompt. The elemental cycle is where
probing shows up: each element's gate rejects a damage type the target resists, so
first-valid walks the cycle while probing and then settles on the best allowed
element. No priority is mutated — the *order* is fixed and the *gates* do the work.

## Customization is a delta

When you edit a class in the [Class Configuration](./configuration/class-configuration.md)
tab, you are not editing the shipped strategy — you are building a sparse **delta**
over it. A delta records only what you changed:

| Delta field | What you changed |
| --- | --- |
| `order` | A lane's full ordered keys, stored only when it differs from the shipped order. The order *is* the membership — a key present is evaluated, a key absent is benched. |
| `params` | Class config knobs you overrode. |
| `args` | Per-action tuning (e.g. an HP threshold) you overrode, keyed by catalog key then param. |

The effective lanes the selector reads are *shipped defaults ⊕ your delta*,
recomputed when the delta is applied. This split has two important consequences:

- **An untouched lane inherits the shipped order.** If a nexBash update improves a
  class's default priority, you get the improvement automatically on any lane you
  never customized.
- **A customized lane owns its order.** If you reordered a lane, a newly shipped
  action lands on your config **bench** (Available column) instead of silently
  injecting into your priority. You decide whether to add it.

Deltas are normalized to a minimal canonical form before saving — a fully-default
class stores nothing at all.

## Per-action tuning (args)

Some actions expose tunable **args** — a numeric or boolean threshold the action's
gate reads (e.g. "fly when self HP drops below this"). Args are seeded over the
whole class action universe, so an action is tunable even while it sits on the
bench. Your overrides are stored in the delta's `args` and merged over the
action's shipped defaults.

## Switching classes

nexBash re-selects the strategy whenever your class changes (it listens for the
nexSys4 class-change event), running the outgoing strategy's `deactivate` and the
incoming one's `activate`. An unsupported class resets the strategy owner to an
inert default and surfaces a notice naming the supported set — navigation and
target selection still work, but no class attacks are queued.

You can also drive selection directly:

```js
nexBash.setStrategy("magi");   // returns true if a strategy was activated
nexBash.currentStrategy?.id;   // "magi"
```

## Profiles

A strategy can hold several **named** customization variants — "solo", "group",
"safe" — and switch between them in-client. A profile *is* a delta. See
[Profiles](./profiles.md).
