---
title: Commands
description: The nb command line for driving nexBash4 in the Nexus client.
---

# Commands

nexBash is driven from the in-game command line with the `nb` alias. Every command
is `nb <verb> [args]`. Type `nb help` in the client for the live list.

## Run control

| Command | Effect |
| --- | --- |
| `nb start` | Start bashing. Resolves the area for your location, enables the Bashing reflex group, starts the run scoreboard, and begins navigating and fighting. |
| `nb stop` | Stop bashing. Disables reflexes, drops the target list, restores curing defaults, and reports the run summary. |
| `nb clear` / `nb reset` | Reload the current area definition and (re)start bashing. Use this after editing targets so the live run picks up the change. |

## Configuration

| Command | Effect |
| --- | --- |
| `nb config` / `nb settings` | Open the configuration dialog. |
| `nb addarea` | Register the current GMCP area as a new (empty) area definition and persist it. |
| `nb addnpc <name>` | Add an NPC target to the active area by exact name. Persisted when the area is registered. |

`nb addnpc` requires an exact, case-sensitive in-game name, for example:

```text
nb addnpc a Nelbennir alchemist
```

## Profiles

Manage the active class's combat [profiles](./profiles.md):

| Command | Effect |
| --- | --- |
| `nb profile` | List profiles, marking the active one. |
| `nb profile <name>` | Switch to a saved profile. |
| `nb profile save <name>` | Save the current priorities as a profile (and make it active). |
| `nb profile rm <name>` | Delete a profile (the implicit `default` is protected). |

## Help

| Command | Effect |
| --- | --- |
| `nb help` | Show the command menu and the supported classes. |

An unknown verb, or `nb` with no verb, prints a short notice pointing you at
`nb help`.

## Calling the parser directly

The alias handler is also exposed on the global, which is handy for scripting or
binding to a button:

```js
nexBash.aliases("start");
nexBash.aliases("profile group");
```
