---
title: Event reference
description: Subscribe to nexMap4 EventStream topics and other observation surfaces.
---

# Event reference

nexMap4 publishes canonical, lowercase, dot-delimited `nexmap4.*` topics through
the required Nexus **EventStream** host contract. This is the public event
surface for other packages and scripts. nexMap4 does **not** emit nexMap3-style
flat names such as `nexMapRoomChanged` or `nexMapPathingComplete`.

## Subscribing

Register a listener through the host `eventStream`:

```js
eventStream.registerEvent("nexmap4.pathing.start", (payload) => {
  console.log(payload.sourceId, payload.targetId, payload.executionMode);
});
```

Payloads are JSON-serializable plain objects. Each event carries the fields
listed below.

## Public topics

| Topic                                | Payload                                                                                                                          | Raised when                                                                                                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `nexmap4.room.changed`               | `{ roomId, rawTopic, source, sequence, timestampMs }`                                                                            | The adapter publishes the coalesced current-room event.                                                                            |
| `nexmap4.room.changed.<id>`          | Same as `nexmap4.room.changed` (`<id>` is the numeric room id).                                                                  | Immediately after `nexmap4.room.changed`, scoped to a specific room.                                                               |
| `nexmap4.mnemosyne.ghost.reconciled` | `{ roomId, syntheticRoomId, sourceRoomId, direction }`                                                                           | Raised once after the factual GMCP node has replaced its ghost and its exits, outgoing edges, and graph notification are complete. |
| `nexmap4.area.changed`               | `{ currentArea, roomId }`                                                                                                        | The current GMCP area name changes (after the room events).                                                                        |
| `nexmap4.pathing.start`              | `{ sourceId, targetId, executionMode, segmentCount, totalWeight }`                                                               | The Stepper accepts a new planned path.                                                                                            |
| `nexmap4.pathing.complete`           | `{ sourceId, targetId, finalRoomId }`                                                                                            | The Stepper reaches the destination.                                                                                               |
| `nexmap4.pathing.blocked`            | `{ sourceId, targetId, segmentIndex, reason, error? }`                                                                           | Path execution cannot continue.                                                                                                    |
| `nexmap4.script.start`               | `{ scriptId, category, sourceRoomId, targetRoomId, segmentIndex, commandsSent, triggerCondition, travelClasses, destinationId }` | Before a scripted-exit segment's commands are sent.                                                                                |
| `nexmap4.script.fired`               | Script payload plus `{ detail }`.                                                                                                | The script's trigger condition is satisfied.                                                                                       |
| `nexmap4.script.timeout`             | Script payload plus `{ detail: { durationMs } }`.                                                                                | The script reaches its `durationMs` ceiling.                                                                                       |
| `nexmap4.bootstrap.phase`            | `{ phase, attempts, ready, completed }`                                                                                          | A startup phase transition (after the host adapter exists).                                                                        |

### Scoped room events

`nexmap4.room.changed.<id>` lets a listener watch one specific room without
filtering the global stream. It carries the same payload as the unscoped event
and fires immediately after it.

## Ordering

For a `Room.Info` followed by a prompt boundary, the observable order is:

1. `nexmap4.room.changed`
2. `nexmap4.room.changed.<id>`
3. `nexmap4.area.changed` (only when the area actually changed)

Outbound room lifecycle events are emitted only after nexMap4 has published its
coalesced native GMCP event internally, so a listener always sees a settled
room model.

## Events vs. state

An event payload explains a _transition_; [`nexMap.state`](./state.md) provides
the current _snapshot_. Integrations that need the full current model should use
the event as a signal and then re-read the appropriate state branch:

```js
eventStream.registerEvent("nexmap4.room.changed", () => {
  const { location } = nexMap.state; // fresh, frozen snapshot
});
```

## Internal runtime EventBus

Internally, nexMap4 also routes host-sourced events and application intents
through a single in-process EventBus so consumers (the Stepper, renderer, and
notices layer) never hold a direct adapter reference. This bus uses short topic
names (`room.changed`, `walker.complete`, `pathing.blocked`, `intent.sendCommands`,
…) and is a runtime implementation detail — it is **not** exposed on the public
`nexMap` global and is not the EventStream surface above. Build integrations
against the `nexmap4.*` EventStream topics, not the internal bus.
