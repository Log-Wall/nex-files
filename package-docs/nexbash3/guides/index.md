---
title: Guides
description: Task-oriented guides for running, configuring, and extending nexBash4.
---

# Guides

Use these pages to run, configure, or understand nexBash4.

## Running and configuring

- [Commands](./commands.md): every `nb` command line.
- [Configuration](./configuration/index.md): the three-tab configuration dialog.
  - [nexBash Options](./configuration/options.md): global toggles and rage reserves.
  - [Class Configuration](./configuration/class-configuration.md): shared strategy settings, action tuning, lane priority, and profiles.
  - [Area Configuration](./configuration/area-configuration.md): per-area settings, target order, and NPC flags.

## Concepts

- [The decision model](./decision-model.md): lanes, pure gates, explicit
  `ActionTuning`, precomputation, and first-valid selection.
- [Strategies](./strategies.md): shipped baselines and the
  `order + args + actionArgs` customization model.
- [Profiles](./profiles.md): complete named variants that switch all three slices
  together.
- [Battlerage](./battlerage.md): the rage track, reserves, and coupling.
- [Areas](./areas.md): the area model, NPC flags, and discovery.
- [Session & automations](./session-and-automations.md): the run scoreboard,
  discovery, and safety/effect automations.

For exact object shapes, callable names, topics, and the persisted settings
document, use the [Reference](../reference/index.md).
