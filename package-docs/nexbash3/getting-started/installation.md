---
title: Installation
description: Install nexBash4 and its prerequisites in the Nexus web client.
---

# Installation

nexBash4 runs in Achaea's Nexus web client and expects the Nexus runtime,
EventStream, GMCP, and **nexSys4** to be available before it loads.

## Prerequisites

nexBash4 is a combat layer on top of other Nexus packages. The following must be
present (they are declared as peer dependencies and are never bundled into
nexBash):

| Package                   | Role                                                                            |
| ------------------------- | ------------------------------------------------------------------------------- |
| **nexSys4** (`nexsys`)    | Character, affliction, defence, balance state and command queues. **Required.** |
| **nexEvent** (`nexevent`) | The `eventStream` pub/sub bus nexBash listens and emits on.                     |

These optional host packages enrich behavior when present:

| Package    | Adds                                                   |
| ---------- | ------------------------------------------------------ |
| **nexMap** | Pathing and area-change detection.                     |
| **nexGui** | Party awareness (leader/membership) for group bashing. |

Install and verify [nexSys4](../../nexSys/getting-started/installation.md) first.

## Install the Nexus package

The release includes `nexBash4.nxs`, a Nexus package file. Import it through the
Nexus package/reflex interface, then reload the client if its package groups do
not appear immediately.

The npm package also ships the prebuilt runtime at `dist/nexbash.min.js`. This
form is intended for scripted installation and integration work:

```js
import("https://unpkg.com/nexbash/dist/nexbash.min.js").then(() => {
  nexusclient
    .packages()
    .get("nexBash4")
    .items.filter((item) => item.type === "group")
    .forEach((group) => {
      group.enabled = true;
    });
});
```

Unlike nexSys4, nexBash4 has no separate bootstrap call. When the bundle is
imported with nexSys4 already loaded and you are logged in, nexBash boots itself:
it loads your saved settings, mounts the configuration UI, and selects the
strategy for your current class.

## Auto-update

On startup nexBash fetches the latest `nexBash4.nxs` from unpkg and applies it to
the installed Nexus package. This is best-effort: a network or parse failure is
logged and ignored, leaving the installed build intact.

## Verify the runtime

After startup, evaluate this in the Nexus developer console:

```js
Object.keys(nexBash);
// includes: "version", "state", "api", "options", "areas", "strategies", ...

nexBash.version;
// "1.0.0"
```

Confirm a strategy was selected for your class and the supported set:

```js
nexBash.currentStrategy?.id; // e.g. "magi", or null on an unsupported class
nexBash.supportedClasses; // ["magi", "occultist", "red dragon", ...]
```

Open the configuration dialog from the in-game command line:

```text
nb config
```

Continue with the [Quickstart](./quickstart.md).
