---
title: API reference
description: Callable namespaces and top-level helpers on the nexBash global.
---

# API reference

Callable behavior is grouped by domain under `nexBash.api`. A small set of
lifecycle helpers and accessors also live directly on the global.

## `nexBash.api` namespaces

| Namespace | Purpose | Methods |
| --- | --- | --- |
| `api.control` | Run lifecycle and run-control flags | `start`, `stop`, `enableLokiCheck` |
| `api.config` | Area / NPC configuration | `setArea`, `addArea`, `addNpc` |
| `api.observe` | Report observed game-state into the owned models | `npc.shield.*`, `npc.cc.*`, `self.effects.*`, `self.battlerage.*` |
| `api.strategy` | Strategy profile management | `profiles.list`, `profiles.active`, `profiles.apply`, `profiles.save`, `profiles.remove` |

### `api.control`

The single canonical lifecycle verbs. `start` and `stop` each flip the master
`enabled` switch, toggle the in-game "Bashing" reflex group, and drive the bash
actor — there is intentionally no separate enable/disable.

```js
nexBash.api.control.start();        // resolve the area for this location, go live
nexBash.api.control.stop();         // go inert; report the run summary
nexBash.api.control.enableLokiCheck(); // arm a one-shot Loki affliction probe
```

`start()` is a visible no-op with a notice when no area matches your location.
`stop()` is silent when no run was active.

### `api.config`

```js
// Make a ready-made Area instance the live bashing area (runs its lifecycle).
nexBash.api.config.setArea(areaInstance);

// Register the current GMCP area as a new (empty) area definition and persist it.
nexBash.api.config.addArea();

// Add an NPC target to the active area. Persisted when the area is registered.
nexBash.api.config.addNpc("a Nelbennir alchemist");
```

`setArea` is the programmatic entry point other packages (e.g. quest areas) use
to drive nexBash through an `Area` they built; ephemeral areas passed this way
are not added to `nexBash.areas`.

### `api.observe`

The ingress vocabulary mirroring nexSys4's `api.observe.*`: triggers, skill
matches, and GMCP bridges *report what they observed* with `got` / `lost`, and
the owner models decide what changed. Scoped by subject so the two are never
conflated — `npc.*` is a combatant's attributes, `self.*` is your character's
nexBash-owned state.

```js
// A combatant gained / lost a shield (name optional → the active target).
nexBash.api.observe.npc.shield.got("a tuar warrior");
nexBash.api.observe.npc.shield.lost();

// A crowd-control type landed on / faded from a combatant.
nexBash.api.observe.npc.cc.got("sensitivity");
nexBash.api.observe.npc.cc.lost("sensitivity");

// A nexBash-tracked effect became available / unavailable.
nexBash.api.observe.self.effects.got("bloodcloak"); // bloodcloak | maya | deathcape
nexBash.api.observe.self.effects.lost("maya");

// Battlerage availability: the shared balance, or a named ability's own cooldown.
nexBash.api.observe.self.battlerage.got();
nexBash.api.observe.self.battlerage.lost();
nexBash.api.observe.self.battlerage.ability.got("disintegrate");
nexBash.api.observe.self.battlerage.ability.lost("disintegrate");
```

### `api.strategy.profiles`

Named customization variants of the **active class's** strategy. See
[Profiles](../guides/profiles.md).

```js
nexBash.api.strategy.profiles.list();        // ["default", "solo", "group"]
nexBash.api.strategy.profiles.active;         // "default" (getter)
nexBash.api.strategy.profiles.apply("group"); // swap to a profile (persists)
nexBash.api.strategy.profiles.save("solo");   // snapshot current tuning as a profile
nexBash.api.strategy.profiles.remove("solo"); // delete a profile (default is protected)
```

Each command resolves against the active strategy: an unsupported class or an
unknown profile surfaces an in-client notice and is a no-op — it never throws.

## Top-level lifecycle helpers

| Member | Purpose |
| --- | --- |
| `nexBash.setStrategy(name)` | Look up a class strategy by name and make it active; surfaces a notice and resets to inert on an unsupported class. Returns whether one was activated. |
| `nexBash.aliases(input)` | Parse and execute an `nb …` command string (the alias entry point). See [Commands](../guides/commands.md). |
| `nexBash.notice(text)` | Emit a nexBash status notice to the client (respects the `notices` option). |
| `nexBash.log(text)` | Emit a diagnostic log line (respects the `logging` option). |

## Catalog and trace handles

| Handle | Purpose |
| --- | --- |
| `nexBash.actionCatalog` | The flat, namespaced action catalog: `entries`, `keys`, `byId`, `ambiguousIds`, `get(key)`, `has(key)`, `list({namespace})`, `listById(id)`. |
| `nexBash.trace` | The decision trace stream: `enable()`, `disable()`, `subscribe(fn)`, `list()`, `clear()`, `isTracing()`. Off by default. |
| `nexBash.classes` | The `Npc` and `Area` constructors, for building areas programmatically. |
| `nexBash.areas` | The registered area definitions (sorted by name). |
| `nexBash.strategies` | The shipped per-class strategies, keyed by class id. |

## Return values

Predicate and toggle methods return booleans. Configuration mutations commonly
return whether a change was made (and emit a notice). Callers should not assume a
mutation is synchronous server confirmation — use `state` and events to observe
the confirmed result.

## Events are separate

Listeners do not live under `api`. Other packages attach listeners through the
Nexus `eventStream` global. The [events page](./events.md) lists the topics
nexBash emits and the host topics it reacts to.
