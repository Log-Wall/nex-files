---
title: Curing and priorities
description: How nexSys4 manages baseline curing intent and live server state.
---

# Curing and priorities

nexSys4 treats configuration as intent, not as an assumption that the server
already matches it. The runtime compares its desired settings and priorities
with observed server-side curing state, then sends only the changes needed to
reconcile them.

## Defaults and working values

Afflictions and defences have two useful notions of priority:

- The **default priority** is the persisted baseline selected in configuration.
- The **working priority** is the value currently requested by the runtime.

Changing a default updates the baseline. A rule can temporarily change the
working priority; when that rule stops applying, nexSys4 can return to the
baseline without destroying the player's saved configuration.

## State layers

`nexSys.state.serverside` exposes the reconciliation layers used for diagnosis:

- `baseline` and `sessionBaseline` describe the stable intent.
- `desired` is the result after active overlays are applied.
- `observed` records what nexSys4 has confirmed from Achaea.
- `transient` contains one-shot prediction requests, prioritized afflictions,
  and manual queue state.
- `pending` records work awaiting confirmation.

Most users should configure curing through the dialog. Integrations can use
the domain methods under `nexSys.api.affs`, `nexSys.api.defs`, and
`nexSys.api.ss`; see the [API reference](../reference/api.md).

## Pause and slow mode

Pausing controls normal runtime output. The **Queue while paused** setting
governs whether queue work is still allowed. Slow mode is a separate runtime
control used when prompt-bound output should be restricted.

Inspect `nexSys.state.system.runtime` when diagnosing either behavior.

