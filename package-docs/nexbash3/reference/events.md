---
title: Events
description: EventStream topics nexBash4 emits, and the host topics it reacts to.
---

# Events

nexBash communicates over the Nexus `eventStream` global — the canonical listener
interface for cross-package integrations. Other packages subscribe the same way
they would to any Nexus topic:

```js
eventStream.registerEvent(
  "nexbash4.target.selected",
  (target) => {
    console.log("nexBash engaged", target.name);
  },
  { id: "my-package:target-selected", tags: ["my-package"] },
);
```

All listeners nexBash itself registers are tagged `["nexBash"]` (plus a more
specific tag) so they can be bulk-removed across machine restarts, strategy
switches, and area changes.

## Topics nexBash emits

These `nexbash4.*` topics are nexBash's outbound contract. An integration may
rely on them.

### Target and combat

| Topic | Payload | Emitted when |
| --- | --- | --- |
| `nexbash4.target.selected` | the chosen target object | A target is selected to engage. |
| `nexbash4.target.gotShield` | the target | The active target raised a shield. |
| `nexbash4.npc.lostShield` | the razed NPC | A combatant's shield came down (raze or observed loss). |
| `nexbash4.target.lost` | none | The active target left the room or died. |
| `nexbash4.target.slain` | none | The active target was killed. |

### Area and run

| Topic | Payload | Emitted when |
| --- | --- | --- |
| `nexbash4.started` | `{ area }` | A run went live. Fires once per run (not on an actor-reuse restart), so it pairs 1:1 with `nexbash4.stopped`. |
| `nexbash4.stopped` | `{ area, summary }` | A run went inert on **any** route — manual `stop()`, a STOP event, or area-clear self-completion. Fires once per run; `summary` is the final `{ kills, gold, elapsedMs }` scoreboard. |
| `nexbash4.area.cleared` | the active `Area` | The bashing run completed (for routed areas). Precedes the run's `nexbash4.stopped`. |
| `nexbash4.room.cleared` | `GMCP.Room.Info` | The current room holds no targets — a fresh room with nothing spawned yet, or the last target just died. Fires every time `checkingForTargets` confirms this, so it may repeat for the same room. |
| `nexbash4.discovery.recorded` | `{ areaKey, areaName, npc, field, value, source }` | A new mob observation was recorded mid-run, such as an observed damage range. |
| `nexbash4.discovery.report` | `{ reason, area, discoveries }` | A run ended (`reason` is `"manualStop"` or `"areaClear"`); reports the run's discoveries. |
| `nexbash4.quest.chain.complete` | none | A scripted quest chain finished. |

### Effect availability

The life-force talisman effects (bloodcloak, deathcape, maya) announce when they
become usable and when they go away. These are the high-level semantic topics a
display attaches to; the payload is the effect name.

| Topic | Payload | Emitted when |
| --- | --- | --- |
| `nexbash4.effect.got` | `"bloodcloak"` \| `"deathcape"` \| `"maya"` | The effect became available. Fires once on the availability edge, not on each recharge (the timer's `*.started.<id>` topic marks recharges). |
| `nexbash4.effect.lost` | the effect name | The effect was consumed or its hold expired. Fires once, whichever edge (game text or the expiry timer) came first. |
| `nexbash4.effect.charged` | `{ name, charges, max }` | A charge accrued. Only deathcape reports a running count (`0`→`50`); it fires on **every** kill line (even at full), carrying the authoritative count for a counter display. Bloodcloak and maya are binary availability and never emit this. |

### Effect timers

The transient-effect expiry timers (bloodcloak, maya, deathcape) emit a scoped
lifecycle topic per timer id:

| Topic | Emitted when |
| --- | --- |
| `nexbash4.timer.started.<id>` | The timer started or re-armed. |
| `nexbash4.timer.reset.<id>` | The timer was reset. |
| `nexbash4.timer.stopped.<id>` | The timer elapsed (the effect winds down). |

`<id>` is `bloodcloak`, `maya`, or `deathcape`. nexBash listens to its own
`*.stopped.<id>` topics to mark the matching effect unavailable.

## Topics nexBash reacts to

nexBash is primarily a **consumer** of host state. It subscribes to the following
topics from nexSys4, nexMap, and the raw Nexus/GMCP stream. These are listed for
context — they are owned by those packages, not by nexBash.

### Always-on (application level)

| Topic | nexBash's reaction |
| --- | --- |
| `nexsys4.system.class.changed` | Re-select the class strategy. |
| `nexmap4.area.changed` | Resolve and apply the area for the new location. |
| `IRE.Misc.Achievement` | Update the session kill count and collect gold. |
| `IRE.Target.Info` | Update the active target's HP. |
| `nexskill.match.skill.<skill>.<id>` | Track crowd-control landing on a target (stormbolt, dilation, ague, scorch, psidaze, deaden, temperance, stagnate, cleanseaura, boinad, curse). |
| `nexskill.match.npc` | Record NPC damage received during an active run. |
| `nexsys4.aff.got` / `nexsys4.aff.lost` | Drive the bloodcloak → bloodshield automation. |
| `nexsys4.def.got.bloodshield` / `.lost.bloodshield` | Drive the bloodcloak automation. |
| `PromptEvent` | One-shot Loki affliction probe and gold collection. |
| `nexbash4.target.selected` | Pre-draw morimbuul and run per-area target customizations. |

### Combat-scoped (only while a run is live)

The bash machine subscribes these only in its `combat` state and tears them down
on exit:

| Topic | nexBash's reaction |
| --- | --- |
| `PromptEvent` | Per-prompt attack selection. |
| `battlerageUpdate` / `nexsys4.def.got.freerage` / `nexsys4.system.rage.changed` | Re-run autonomous battlerage selection. |
| `nexskill.match` | Track skill razes and battlerage ability/balance consumption; NPC matches on the same generic topic are ignored unless they carry `action.skill`. |
| `IRE.Display.ButtonActions` | Track per-ability battlerage availability. |
| `nexsys4.item.room.added` / `.removed` | Detect a mob entering or the target leaving/dying. |
| `nexmap4.room.changed` / `nexmap4.pathing.start` / `nexmap4.pathing.complete` | Drive room re-scan and pathing updates. |
| `Room.Players` | Re-evaluate room contest and target count. |
| `nexsys4.system.paused` / `.unpaused` | Pause / resume the run. |
| `nexsys4.def.got.shield` / `.got.prismatic` / `nexsys4.aff.got.aeon` | Suspend offence and clear offence queues. |

## Contract notes

- `battlerageUpdate` is an internal signal nexBash raises to poke its own rage
  re-evaluation; it is not a `nexbash4.*` topic and is not a stable integration
  point.
- Effect-timer topics are scoped by id; subscribe to the specific
  `nexbash4.timer.stopped.bloodcloak` form, not a wildcard.
- nexBash never freezes, clones, or deletes from the global `GMCP` object — it is
  the shared source of truth for the whole client.
