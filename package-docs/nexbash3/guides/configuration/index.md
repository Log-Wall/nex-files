---
title: Configuration
description: Overview of the nexBash4 configuration dialog and its atomic draft.
---

# Configuration

Open the dialog with:

```text
nb config
```

Every control edits a Zustand **draft**. **Save** validates and applies the whole
draft before persistence; **Cancel** discards it. Runtime combat and stored
settings therefore never observe a half-edited profile.

## Tabs

| Tab | Purpose |
| --- | --- |
| [nexBash Options](./options.md) | Global behavior toggles and battlerage reserves. |
| [Class Configuration](./class-configuration.md) | Shared profile settings, action tuning, lane priority, and complete profiles. |
| [Area Configuration](./area-configuration.md) | Per-area settings, target order, and per-NPC combat flags. |

## How the draft works

Opening the dialog hydrates current runtime owners into detached plain objects:

- Global toggles and rage buffers populate `options` and `battlerage`.
- Each strategy draft carries profiles plus an editor for `lanes`, strategy
  `args`, and `actionArgs`.
- Area and target edits populate per-area settings.

Profile switching and **Save as** first fold all three strategy slices into a
minimal `{ order?, args?, actionArgs? }` delta. On dialog **Save**, only current
schema shapes are validated, installed through their runtime owners, and written
to the Nexus variable store.

Legacy storage healing does not occur in Zustand. It happens once at the Zod/I/O
boundary before runtime hydration; a healed load is rewritten as canonical schema
v3. See [Options & settings](../../reference/options.md).

A customized lane owns its full order, so newly shipped actions appear on the
Available bench instead of being injected into the player's priority. See
[Strategies](../strategies.md).

:::note Screenshots
Screenshots illustrate layout. The installed release remains the authority for
available fields, conditional subtabs, and defaults.
:::
