---
title: Quickstart
description: Configure nexBash4 and start your first bashing run.
---

# Quickstart

This walks you from a fresh install to a live bashing run. nexBash is driven from
the in-game command line with the `nb` alias and configured through a dialog.

## 1. Confirm your class is supported

```text
nb help
```

The help output lists every command and the **supported classes**. nexBash
selects the strategy for your class automatically on login and whenever your
class changes. If your class is unsupported, nexBash will still navigate and
pick targets, but it won't run class attacks.

The current shipped set is **Depthswalker**, **Magi**, **Occultist**, **Psion**,
**Black Dragon**, **Blue Dragon**, **Red Dragon**, **Golden Dragon**, and
**Fire Lord**. Treat `nb help` as the authority for the installed build.

## 2. Open configuration

```text
nb config
```

The dialog has three tabs:

| Tab | Purpose |
| --- | --- |
| [nexBash Options](../guides/configuration/options.md) | Global toggles and battlerage rage reserves |
| [Class Configuration](../guides/configuration/class-configuration.md) | Shared profile settings, action tuning, lane priority, and profiles |
| [Area Configuration](../guides/configuration/area-configuration.md) | Per-area settings, target priorities, and NPC combat flags |

Edits are a **draft** — nothing reaches the live runtime until you **Save**.
**Cancel** discards the draft.

## 3. Review your options

On **nexBash Options**, confirm the global toggles (in-game notices, use rage to
raze, swap on shield, use morimbuul) and the three battlerage reserves (shield,
CC, general). Defaults are sensible; see [Options](../guides/configuration/options.md).

## 4. Check area configuration

On **Area Configuration**, pick the area you intend to bash. On the **Area Settings** sub-tab, configure the target threshold and any avoid targets. On the **Target Priorities** sub-tab, targets are tried top-to-bottom. You can:

- Add an NPC by exact (case-sensitive) name, or pick one **From room**.
- Drag to reorder the priority list.
- Select a target and toggle its combat flags (can shield, can web, should CC, …).

Save when done.

## 5. Start bashing

Walk to the area (or its start room) and run:

```text
nb start
```

nexBash resolves the area for your location, enables its reflexes, begins the
session scoreboard, and greets the run. It then scans the room, fights, and tracks your progress.

Other run commands:

| Command | Effect |
| --- | --- |
| `nb stop` | Stop bashing and report the run summary. |
| `nb clear` | Reload the current area and (re)start — useful after editing targets. |

See the full list in the [Commands guide](../guides/commands.md).

## 6. Verify live state

While running, inspect a read-only snapshot in the console:

```js
nexBash.state.system;   // { version, enabled }
nexBash.state.area;     // { id, name, targetThreshold }
nexBash.state.combat;   // { hasTarget, target, targetCount }
nexBash.state.session;  // { kills, gold, elapsedMs }
```

For a complete, copyable debug snapshot:

```js
JSON.stringify(nexBash.state, null, 2);
```

## 7. Save a profile (optional)

If you tuned your class for a specific situation (solo vs. group, a safe ramp,
different equipment, etc.), save it as a named **profile**. Lane order, shared
strategy settings, and action tuning switch together:

```text
nb profile save solo
nb profile group
nb profile
```

See [Profiles](../guides/profiles.md).
