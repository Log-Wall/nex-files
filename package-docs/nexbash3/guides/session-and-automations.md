---
title: Session & automations
description: The per-run scoreboard, mob discovery, and the safety/effect automations.
---

# Session & automations

Beyond choosing attacks, nexBash runs a set of background features that score your
run, learn about the mobs you fight, and keep you alive. This page covers them.

## The session scoreboard

A **run** begins on `nb start` and ends on `nb stop` or when an area auto-clears.
nexBash snapshots your baselines at the start and reports the deltas at the end:

| Metric | Source |
| --- | --- |
| `kills` | Achievement kill counter delta over the run. |
| `gold` | Gold gained over the run (clamped at 0, so spending never shows negative). |
| `elapsedMs` | Wall-clock time since `nb start`. |

Read it live any time:

```js
nexBash.state.session;
// { kills: 18, gold: 2400, elapsedMs: 305000 }
```

When a run ends, nexBash prints a one-line scoreboard summary. The scoreboard
zeroes out once stopped, until the next `nb start`.

## Discovery

While fighting, probing strategies record observed damage ranges for each mob and
damage type. Rather than crowding the chat notice, the end-of-run discovery
report — resistances, damage types, observed damage ranges, and damage taken,
grouped per NPC — is written to the browser dev console as a table
(`console.table`) so you can review and vet the data before marking any NPC
flags such as resistances.

Discoveries are de-duplicated per run (by area, NPC, field, and value), reported
at the end of the run, and surfaced on the `nexbash4.discovery.recorded` and
`nexbash4.discovery.report` [events](../reference/events.md). The
[Area Configuration](./configuration/area-configuration.md) tab is where vetted
NPC data is edited.

## Area lifecycle automations

Each registered area can persist ordered commands for two edges: **On
activation** and **On deactivation**. Configure them under **Area Configuration
→ Area Settings**. Activation commands run after the area's code-authored setup
is live; deactivation commands run before its scoped resources are released.
An explicit `nb clear` therefore runs both lists as part of the reload.

These entries are intentionally command-only. Code belonging to another package
should use the frozen `nexbash4.area.activated` and
`nexbash4.area.deactivated` [events](../reference/events.md#area-lifecycle), so
that package retains ownership of its listeners and cleanup.

## Safety and effect automations

These run automatically based on your options and per-NPC flags.

### Offence suspension

When a defence or affliction makes attacking pointless or dangerous — your own
**shield**, **prismatic**, or **aeon** — nexBash suspends offence and clears the
offence queues until it lifts, with a notice. This is a live guard on every
attack and battlerage decision, not a separate mode.

### Swap on shield

With **Swap on shield** enabled, when your current target raises a shield nexBash
switches to another valid target rather than stalling — unless it can raze the
shield instead. Pair with the per-NPC **Can Shield** / **Can Raze** flags. See
[Battlerage](./battlerage.md) for the raze path.

### Morimbuul pre-draw

With **Use morimbuul** enabled, nexBash draws morimbuul before engaging a mob
flagged **Can Web**, so a web doesn't catch you empty-handed. It only draws when
you aren't already wielding it.

### Bloodcloak → bloodshield

When the bloodcloak effect is available and you take a lock-style affliction set
(paralysis, webbing, impale, transfixion, or prone with a broken leg), nexBash
activates bloodshield to protect you, and clears the queued activation when the
danger passes. Availability is read from the game's own bloodcloak charge lines.

### Transient effect timers

The bloodcloak, maya, and deathcape effects are charge/time-gated. nexBash tracks
their availability and re-arms their expiry timers as you rack up kills, winding
each flag down when its timer elapses (`nexbash4.timer.stopped.<id>`). The current
availability is in `nexBash.state.effects`.

### Loki check

`nb`-armed via the API, the **Loki check** runs a one-shot affliction probe on the
next prompt — a sequence of balance and off-balance actions that reveals hidden
afflictions (asthma, disloyalty, paralysis, and more), choosing an unused exit to
test movement locks:

```js
nexBash.api.control.enableLokiCheck();
```

It fires once and disarms itself.
