---
title: Layouts
description: Save, apply, and manage multiple named panel layouts, and use the native display override.
---

# Layouts

nexGui4 panels are Nexus FlexLayout tabs, so you arrange them by dragging,
docking, floating, and resizing. On top of that, nexGui4 keeps a collection of
**named layouts** — save one arrangement per screen you play on and switch
between them.

## Saving and switching

```js
nexGui.api.layout.save("bigMonitor"); // snapshot the current arrangement
nexGui.api.layout.apply("laptop"); // switch to a stored layout
nexGui.api.layout.list(); // => ["kDesktop", "mobile", "bigMonitor", …]
nexGui.api.layout.has("laptop"); // whether that name is stored
nexGui.api.layout.remove("laptop"); // delete it
```

A typical session: arrange your panels the way you want them on the current
screen, then `save()` under a name that means something to you.

```js
// At the desk, on the external monitor:
nexGui.api.layout.save("bigMonitor");

// Later, on the laptop — rearrange, then:
nexGui.api.layout.save("laptop");

// From then on, switch with:
nexGui.api.layout.apply("bigMonitor");
```

Saving under a name that already exists overwrites it, so re-saving is how you
update a layout after tweaking it.

Each call prints a nexGui notice telling you what it did — `Saved the current
layout as "bigMonitor".`, `Applied layout "laptop".`, or, in red, why it could
not (no name given, no layout under that name, or the store being full). Wire
these calls to aliases and you get the feedback for free.

Layouts persist through the same `nexGui4Settings` storage as every other nexGui
setting, so they follow you across sessions.

## Starter layouts

Two starter layouts ship with nexGui4 and are seeded into your collection the
first time it is created:

- `kDesktop` — the full multi-panel desktop arrangement.
- `mobile` — a compact single-column arrangement with panels in the right
  border drawer.

They are ordinary entries. You can apply them, overwrite them with `save()`
under the same name, or delete them outright — nexGui4 will not put them back.

## Return values

Every method returns data or a boolean, and none of them print to the display,
so you can build your own aliases or UI on top:

- `list()` — array of stored layout names, in insertion order.
- `has(name)` — `true` when a layout is stored under `name`.
- `save(name)` — `false` for a blank name, or when the stored-layout limit
  (20) is reached. Overwrites still succeed once full.
- `apply(name)` — `false` when nothing matches `name`.
- `remove(name)` — `false` when no layout was stored under `name`.

See [`nexGui.api.layout`](../reference/api.md#nexguiapilayout) for the full
contract.

## Native display {#native-display}

By default the main game display is its own surface. The **Native Display
Override** (on the [Advanced options tab](./options.md#advanced)) instead mounts
the nexGui display directly into the Nexus output area.

The toggle applies immediately. When enabled, the standalone display tab is
hidden on the next reload; when disabled, the host's default output behavior is
restored. The same operation is available programmatically:

```js
nexGui.api.customize.nativeDisplay.mount();
nexGui.api.customize.nativeDisplay.unmount();
```
