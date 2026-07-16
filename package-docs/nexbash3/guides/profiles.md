---
title: Profiles
description: Save and switch complete named variants of a class strategy.
---

# Profiles

A **profile** is a named customization variant of a class
[strategy](./strategies.md). The strategy is the shipped baseline; each profile is
a sparse delta layered over it.

A profile is a complete atomic variant. Its delta may contain:

- lane membership and order (`order`);
- shared strategy settings (`args`); and
- action-local tuning (`actionArgs`).

Switching profiles therefore changes the whole combat setup together, rather
than leaving equipment or thresholds behind from the previous variant.

## The default profile

Every class has an implicit `default` profile. A class you have never customized
has an empty default delta and behaves exactly like its shipped strategy. The
`default` profile cannot be renamed or deleted.

## Switching is safe mid-combat

Applying a profile rebuilds effective lanes and both arg scopes from shipped
defaults, then replaces the strategy's precomputed tuning map. The selector sees
the complete new variant on its next decision tick; no restart is required.

```text
nb profile group
```

```js
nexBash.api.strategy.profiles.apply("group");
```

## Managing profiles

### From the command line

| Command | Effect |
| --- | --- |
| `nb profile` | List profiles and mark the active one. |
| `nb profile <name>` | Switch to a saved complete variant. |
| `nb profile save <name>` | Save the current strategy customization as a profile and make it active. |
| `nb profile rm <name>` | Delete a profile. |

### From the API

```js
nexBash.api.strategy.profiles.list();
nexBash.api.strategy.profiles.active;
nexBash.api.strategy.profiles.apply("solo");
nexBash.api.strategy.profiles.save("solo");
nexBash.api.strategy.profiles.remove("solo");
```

Every command resolves against the active class strategy. An unsupported class
or unknown profile produces an in-client notice and a safe no-op. Successful
changes persist immediately.

### From the configuration dialog

The [Class Configuration](./configuration/class-configuration.md) toolbar has a
**Profile** dropdown plus **Save as**, **Rename**, and **Delete**. The dialog edits
the active profile's complete variant. Before switching or forking, it folds the
current lane, Settings-tab, and action-tuning edits into the outgoing draft
profile, so no in-progress work leaks or disappears.

The dialog itself remains atomic: these are draft changes until its main
**Save** button is pressed; **Cancel** leaves runtime and storage untouched.

## How profiles are stored

Each persisted class entry is `{ activeProfile?, profiles }`, and every profile
value is a normalized `{ order?, args?, actionArgs? }` delta. Empty profiles and
default-only classes are omitted; `activeProfile` is omitted when it is
`default`.

Settings schema v3 has one current profile shape. At load, a boundary healer can
fold older flat strategy deltas into `default`, rename the prior strategy
`params` scope to `args`, and move prior nested per-action `args` into
`actionArgs`. The runtime and profile editor never see those legacy names. After
reconciliation, noncanonical storage is replaced with a current canonical
snapshot, while an already-canonical document is not rewritten.

See [Options & settings](../reference/options.md) for the complete persisted
document and healing behavior.
