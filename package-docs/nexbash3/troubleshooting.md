---
title: Troubleshooting
description: First checks for nexBash4 installation, startup, runs, and state issues.
---

# Troubleshooting

## `nexBash` is missing or incomplete

The runtime bundle has not loaded, or a prerequisite is absent. nexBash boots
itself when imported **with nexSys4 already loaded and you logged in**. Confirm:

```js
typeof nexSys;            // "object" — nexSys4 must be present first
typeof eventStream;       // "object" — nexEvent
typeof nexAction;         // "object" — nexAction
Object.keys(nexBash);     // should include state, api, options, areas, strategies
```

If nexSys4 is missing, install and verify it first — nexBash is a layer on top of
it. See [Installation](./getting-started/installation.md).

## My class has no attacks

nexBash only ships class attacks for supported classes. Check:

```js
nexBash.currentStrategy?.id;  // null on an unsupported class
nexBash.supportedClasses;     // the classes with a shipped strategy
```

On an unsupported class, nexBash still navigates and selects targets but queues no
class attacks, and shows a notice naming the supported set. nexBash re-selects the
strategy when your class changes; if it didn't, force it:

```js
nexBash.setStrategy(GMCP.Char.Status.class.toLowerCase());
```

## `nb start` says "No area found for this location"

nexBash has no registered area matching your current `GMCP.Location`. Either walk
to a supported area, or register the current one:

```text
nb addarea
```

Then add its targets (`nb addnpc <name>` or the Target Priorities tab) and
`nb clear` to reload and start.

## The configuration dialog does not open

Open it from the command line:

```text
nb config
```

If nothing happens, the React UI may not have mounted — confirm `ReactDOM` is
available in the client and that startup completed (see the first section).

## Settings appear not to save

The dialog edits a **draft**. Press **Save**, not Cancel. After saving, inspect:

```js
nexBash.options;                 // the live option flags
nexBash.config.battlerage;       // the live rage reserves
nexusclient.variables().vars.nexBash4Settings;  // the persisted blob
```

If you edited targets, run `nb clear` so a live run reloads the area.

## nexBash isn't attacking

Most often offence is suspended or there is no valid target. Check:

```js
nexBash.state.system;   // { enabled, slow } — is a run actually live?
nexBash.state.combat;   // { hasTarget, target, targetCount }
```

nexBash suspends offence while you have **shield**, **prismatic**, or **aeon** up
(it announces this), and skips actions whose situational gate fails this prompt
(off balance, resisted damage type, wrong target state). Turn on the decision
trace to see exactly why an action was or wasn't chosen:

```js
nexBash.trace.enable();
// …let it run a few prompts…
nexBash.trace.list();
nexBash.trace.disable();
```

## Battlerage isn't firing

Confirm you are on battlerage balance and above the relevant reserve, and that
automatic-curing isn't suppressing it:

```js
nexBash.state.battlerage;   // balance + the configured buffers
nexBash.debug();            // logs each rage candidate, cost, and availability
```

Lower the reserves on the [Options tab](./guides/configuration/options.md) if rage
is being held back too aggressively.

## Collecting a bug report

Immediately after the problem occurs, run:

```text
nb report
```

Open the developer console and copy the complete `nexBash diagnostic report`
block. The same report is available programmatically as
`nexBash.api.diagnostics.report()`. It omits character and player names, but it
does contain NPC names, target/item IDs, area configuration, and combat tuning;
review it before sharing publicly. If the console also shows an exception, copy
that error and stack trace alongside the report.
