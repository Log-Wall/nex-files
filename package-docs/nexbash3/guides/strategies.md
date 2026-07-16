---
title: Strategies
description: Per-class shipped baselines, scoped tuning, and customization deltas.
---

# Strategies

A **strategy** is a class's combat baseline expressed as data: ordered lanes,
optional shared settings, and an optional ingestion lifecycle. nexBash ships one
strategy per supported class and selects yours automatically from your in-game
class.

For moment-to-moment selection, read
[The decision model](./decision-model.md) first.

## What ships

Each shipped strategy can contain:

- An `id` matching the lowercased class, such as `magi` or `red dragon`.
- One or more ordered **lanes** of catalog keys: a `primary` lane and usually a
  `battlerage` lane.
- Optional strategy-scoped `args` and `argMeta`. Metadata supplies labels, help,
  grouping, and field presentation; it is never read by combat gates.
- An optional `activate` / `deactivate` lifecycle for class-specific observation
  ingestion. Occultist uses this to record a cleanseaura fact without putting
  class branches in the generic selector.

The current supported set is **Depthswalker**, **Magi**, **Occultist**, **Psion**,
**Black Dragon**, **Blue Dragon**, **Red Dragon**, **Golden Dragon**, and
**Fire Lord**. Confirm the installed set with `nb help` or
`nexBash.supportedClasses`.

### Example lane

Magi's primary lane is defensive-first, then offensive, then its elemental
staff cycle:

```text
general.fly
general.flee
tattoos.shield
magi.erode
magi.stormhammer
magi.dissolution
magi.scintilla
magi.horripilation
magi.lightning
```

Selection walks the lane top-to-bottom each prompt. The order remains static;
pure action gates decide which entries are legal for the current context.

## Two configuration owners

Values live with the concern they describe:

- **Strategy args** describe the whole class setup and are shared by every
  primary action and battlerage in that profile. Depthswalker's `daggerId` and
  `scytheId` are examples.
- **Action args** describe one catalog action. An individual action's HP threshold
  is an example.

Actions receive both scopes explicitly:

```js
canExecute(ctx, tuning) {
  return ctx.selfHp < tuning.action.hp;
}

execute(ctx, tuning) {
  return `wield ${tuning.strategy.scytheId}`;
}
```

Strategy args may be strings, numbers, or booleans, provided an override matches
the primitive type of its shipped default. Unknown keys and wrong types do not
enter effective runtime tuning.

## Customization is a delta

The configuration dialog does not mutate the shipped baseline. It builds a
sparse delta containing only profile changes:

| Delta field | What it owns |
| --- | --- |
| `order` | A lane's full ordered catalog keys when membership/order differs from the shipped lane. |
| `args` | Strategy-scoped primitive overrides. |
| `actionArgs` | Per-action primitive overrides, keyed by catalog key and then argument name. |

The obsolete class `config` / delta `params` model is not part of the current
runtime shape. Global nexBash options still belong to `ctx.config`; that is a
different owner from strategy-profile tuning.

An untouched lane inherits its shipped order, so later baseline improvements flow
through. Once customized, a lane owns its full order; newly shipped actions appear
on the **Available** bench rather than being injected into the player's priority.

Deltas are normalized to a minimal canonical form before persistence. A fully
default class stores no profile entry.

## Effective and precomputed state

Applying a profile always rebuilds the effective lanes, strategy args, and action
args from shipped defaults plus that one delta. It then derives an immutable
`ActionTuning` envelope for every effective catalog key:

```js
{
  strategy: strategy.args,
  action: strategy.actionArgs[key],
}
```

The selector reads this precomputed map once per candidate and returns the
winning reference with the choice. No prompt-time tuning merge or action-global
strategy read is needed. An action added from the bench receives the active
strategy scope automatically.

## Switching classes

nexBash re-selects the strategy whenever your class changes, running the outgoing
strategy's `deactivate` and the incoming one's `activate`. An unsupported class
resets the strategy owner to an inert state and surfaces a notice; navigation and
target selection remain available, but class attacks are not queued.

```js
nexBash.setStrategy("magi");
nexBash.currentStrategy?.id; // "magi"
```

## Profiles

A strategy can hold several named, complete customization variants such as
`solo`, `group`, and `safe`. A profile switches its lane order, shared strategy
args, and action args together. See [Profiles](./profiles.md).
