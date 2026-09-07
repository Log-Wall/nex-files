---
title: API reference
description: Public callable namespaces exposed by nexGui4.
---

# API reference

Functions are grouped by domain under `nexGui.api`. Data snapshots live under
`nexGui.state`; `api` holds only behavior.

## Namespaces

| Namespace       | Purpose                                            | Representative methods                                            |
| --------------- | -------------------------------------------------- | ----------------------------------------------------------------- |
| `api.character` | Character class checks                             | `class.get`, `class.is`                                           |
| `api.target`    | Current combat target                              | `get`, `set`, `is`                                                |
| `api.players`   | Player directory queries                           | `get`, `color`, `fetch`, `qwFormat`                               |
| `api.display`   | Display helpers (alias `api.colors`)               | `playerColor`, `iconHtml`, `notice`                               |
| `api.timers`    | Timer bars                                         | `add`, `start`, `stop`, `reset`, `remove`, `clear`, `get`, `list` |
| `api.customize` | Configured defences, class balance, native display | `defences.set`, `classBalance.set`, `nativeDisplay.mount`         |
| `api.layout`    | Named layout templates                             | `list`, `has`, `save`, `apply`, `remove`                          |
| `api.party`     | Party membership                                   | `isMember`                                                        |
| `api.room`      | Room display overrides and text replacements       | `items.set`, `npcs.set`, `replacements.set`                      |
| `api.stream`    | System / Combat side streams                       | `add`                                                             |
| `api.cdb`       | Character database                                 | `query`, `get`                                                    |

## Verb conventions

| Verb                       | Meaning                                                               |
| -------------------------- | --------------------------------------------------------------------- |
| `get`                      | Synchronous parameterized in-memory read. Bare reads live in `state`. |
| `set`                      | Full overwrite of a scalar or collection.                             |
| `fetch` / `query`          | Asynchronous read that may hit the network.                           |
| `add` / `remove` / `clear` | Mutate a collection.                                                  |
| `list`                     | Enumerate a collection, usually with filters.                         |
| `start` / `stop` / `reset` | Imperative lifecycle on a named entity.                               |
| `mount` / `unmount`        | React or host UI lifecycle commands.                                  |
| `is*`                      | Boolean predicate.                                                    |

---

## `nexGui.api.character`

| Method            | Returns | Notes                             |
| ----------------- | ------- | --------------------------------- |
| `class.get()`     | string  | Current class label.              |
| `class.is(value)` | boolean | Case-insensitive class predicate. |

## `nexGui.api.target`

| Method       | Returns                  | Notes                                                                               |
| ------------ | ------------------------ | ----------------------------------------------------------------------------------- |
| `get()`      | `{ id, name, isPlayer }` | Current two-field target identity.                                                  |
| `set(value)` | string \| null           | Drives the host `settarget`; state reconciles when GMCP echoes the target identity. |
| `is(value)`  | boolean                  | Case-insensitive match against the current target `id` or `name`.                   |

## `nexGui.api.players`

| Method                       | Returns                       | Notes                                                                                                          |
| ---------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `get(name)`                  | object \| null                | Synchronous in-memory profile lookup.                                                                          |
| `color(name)`                | string                        | Player display color.                                                                                          |
| `fetch(name)`                | Promise&lt;object \| null&gt; | Forces a refresh, updates the directory cache, returns the profile.                                            |
| `qwFormat(entries, options)` | string                        | Renders a captured Quick-Who list as a city-grouped table, paints it to the game window, and returns the HTML. |

Directory enumeration lives at `nexGui.state.players.directory`.

`qwFormat` accepts an array of bare names (`"Logan"`) or `{ name, city }`
records — pass the live Quick-Who city so grouping stays correct before any
async `fetch` lands. `options.totalLine` overrides the computed footer.

## `nexGui.api.display`

Also exposed as `nexGui.api.colors` (same object).

| Method                       | Returns | Notes                                                        |
| ---------------------------- | ------- | ------------------------------------------------------------ |
| `playerColor(name)`          | string  | Player display color (same resolver as `api.players.color`). |
| `iconHtml(id, colors, size)` | string  | Renders a dual-tone Font Awesome icon to trusted HTML.       |
| `notice(message, options)`   | void    | Writes a host notice line.                                   |

The city palette lives at `nexGui.state.players.cityPalette`.

## `nexGui.api.timers`

| Method                                | Returns        | Notes                                                                                             |
| ------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `add(id, durationMs, label, options)` | object \| null | Creates or replaces a timer.                                                                      |
| `start(id)`                           | object \| null | Starts an existing timer.                                                                         |
| `stop(id)`                            | object \| null | Stops an existing timer.                                                                          |
| `reset(id)`                           | object \| null | Resets an existing timer.                                                                         |
| `remove(id)`                          | object \| null | Removes a timer.                                                                                  |
| `clear(filters)`                      | number         | Clears all timers, or timers matching `groupId`. Returns the count cleared.                       |
| `get(id)`                             | object \| null | Parameterized timer lookup.                                                                       |
| `list(filters)`                       | object[]       | Filtered enumeration. **Requires** a filter; use `state.timers.list` for the unfiltered snapshot. |

`add` options:

| Option                 | Values                       | Notes                                                                   |
| ---------------------- | ---------------------------- | ----------------------------------------------------------------------- |
| `autoStart`            | boolean                      | Defaults to `false` (created dormant). Set `true` to start immediately. |
| `direction`            | `"countdown"` \| `"countup"` | Countdown drains full→empty; count-up fills empty→full.                 |
| `position`             | `"top"` \| `"bottom"`        | Timer stack placement.                                                  |
| `stayVisible`          | boolean                      | Defaults to `true`. Set `false` to show only while running.             |
| `groupId` / `groupIds` | string \| string[]           | Group metadata for filtered `list` / `clear`.                           |

## `nexGui.api.customize`

| Method                    | Returns        | Notes                                                                            |
| ------------------------- | -------------- | -------------------------------------------------------------------------------- |
| `defences.set(value)`     | string[]       | Replaces the configured defence checklist. Read from `state.customize.defences`. |
| `classBalance.set(value)` | string \| null | Replaces the class-balance stat label. Read from `state.customize.classBalance`. |
| `nativeDisplay.mount()`   | void           | Mounts the display into the host output area.                                    |
| `nativeDisplay.unmount()` | void           | Restores the host's default output area.                                         |

## `nexGui.api.layout`

Named layout templates, persisted in the `layouts` slice of `nexGui4Settings`.
The `kDesktop` and `mobile` starters are seeded into the collection on first run
and are ordinary entries afterwards — overwritable and deletable.

Every method also announces its outcome as a nexGui notice, so aliases wired
straight to these calls give the player feedback without reading the return
value. Failures (missing name, unknown layout, full store) are noticed in red.

| Method          | Returns  | Notes                                                                            |
| --------------- | -------- | -------------------------------------------------------------------------------- |
| `list()`        | string[] | Stored layout names, in insertion order.                                         |
| `has(name)`     | boolean  | Whether a layout is stored under `name`.                                         |
| `save(name)`    | boolean  | Snapshots the live layout, overwriting a same-named entry. `false` for a blank name or when the 20-layout limit is reached. |
| `apply(name)`   | boolean  | Applies a stored layout. `false` when nothing matches `name`.                     |
| `remove(name)`  | boolean  | Deletes a stored layout. `false` when none existed.                              |

## `nexGui.api.party`

| Method           | Returns | Notes                                        |
| ---------------- | ------- | -------------------------------------------- |
| `isMember(name)` | boolean | Case-insensitive party-membership predicate. |

Party data lives at `nexGui.state.party`.

## `nexGui.api.room`

| Method                         | Returns        | Notes                                                                                                                                                                                                                                 |
| ------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `items.set(name, override)`    | object \| null | Sets a display override (`text`, `color`, `background`) for a room item. Returns the normalized override, or `null` if empty.                                                                                                         |
| `items.remove(name)`           | void           | Removes an item override.                                                                                                                                                                                                             |
| `items.get(name)`              | object \| null | Reads an item override.                                                                                                                                                                                                               |
| `items.list()`                 | object[]       | Lists `{ name, override }` records.                                                                                                                                                                                                   |
| `npcs.set(nameOrId, override)` | object \| null | Sets a display override (`text`, `color`, `background`, `idColor`, `nameColor`) for an NPC row. Numeric ids and names are both valid keys. `color` styles the displayed NPC name; `nameColor` can override it when both are supplied. |
| `npcs.remove(nameOrId)`        | void           | Removes an NPC override.                                                                                                                                                                                                              |
| `npcs.get(nameOrId)`           | object \| null | Reads an NPC override.                                                                                                                                                                                                                |
| `npcs.list()`                  | object[]       | Lists `{ name, override }` records.                                                                                                                                                                                                   |
| `replacements.set(id, rule)`   | object \| null | Registers a room-description replacement rule. Requires `pattern: RegExp` and exactly one renderer: `html`, `text`, `marker`, or `segments`.                                                                                          |
| `replacements.remove(id)`      | void           | Removes a user room-description replacement. Removing a same-id override restores the built-in rule.                                                                                                                                   |
| `replacements.get(id)`         | object \| null | Reads a user replacement descriptor.                                                                                                                                                                                                   |
| `replacements.list()`          | object[]       | Lists user replacement `{ id, descriptor }` records.                                                                                                                                                                                   |

Room text replacement renderers are declarative. `html` is trusted raw HTML;
`text` and `segments` are escaped by nexGui. Callback renderers receive
`{ id, match, captures, groups, index, input }`.

```js
nexGui.api.room.replacements.set("boulder", {
  gate: "granite boulder",
  pattern: /A granite boulder sits cracked upon the ground\./g,
  html: () =>
    `<span style="color: tomato">BOULDER! </span><span style="color: red">DANGER!!</span>`,
});
```

## `nexGui.api.stream`

| Method                  | Returns        | Notes                                                                                                                |
| ----------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------- |
| `add({ html, stream })` | object \| null | Appends trusted HTML to the `"system"` or `"combat"` side stream. Throws on a missing `html` or an unknown `stream`. |

See the [Side streams guide](../guides/streams.md). Stream transcripts are not
part of `nexGui.state`.

## `nexGui.api.cdb`

| Method          | Returns                       | Notes                                                                                                                   |
| --------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `query(filter)` | Promise&lt;object[]&gt;       | Filtered query against the stored character database. A missing / empty filter resolves to `[]` without a network call. |
| `get(name)`     | Promise&lt;object \| null&gt; | Live lookup against the Achaea public character API (bypasses the stored database).                                     |

## Return values

Predicate methods return booleans. Lookup methods may return `null` when an id
is unknown. Mutation methods commonly return the resulting value or `null`.
`set(value)` on the target drives a host command and reconciles asynchronously
when GMCP echoes the change — observe the confirmed result through
`nexGui.state`.
