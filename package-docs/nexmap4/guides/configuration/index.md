---
title: Configuration
description: Overview of the nexMap4 settings dialog and persisted options.
---

# Configuration

Open the settings dialog from the client or from JavaScript:

```text
nm config
```

```js
nexMap.api.system.openSettings();
```

The dialog edits a **draft**. **Save** commits the changes and persists them;
**Cancel** discards the draft. Adjusting **Default Zoom** previews live on the
map as you drag, and reverts if you cancel.

## Tabs

| Tab | Purpose |
| --- | --- |
| [Pathing & Travel](./pathing-travel.md) | Pathing mode, command separator, celerity, travel commands, and travel-class toggles |
| [Display](./display.md) | Current-room style, room labels, zoom, background image, notices, and border indicators |
| [City Lockouts](./city-lockouts.md) | Exclude hostile city gate rooms (and arbitrary rooms) from pathing |

## The persisted settings document

Everything the dialog edits — plus your landmarks — lives in one
JSON-serializable settings document accessible through `nexMap.settings`:

| Field | Type | Meaning |
| --- | --- | --- |
| `pathingMode` | `"hybridTrack"` \| `"clientStep"` | Route execution mode. |
| `commandSeparator` | string | Separator used to join batched commands. Default `\|`. |
| `celerity` | number (1–5) | Movement-cost multiplier when celerity is active. Default `2`. |
| `disabledTravelClasses` | string[] | Travel classes excluded from pathing. |
| `travelCommands` | object | Commands for `eagleWings`, `atavianWings`, `islandWings`, and `hourglass`. |
| `display` | object | All [Display](./display.md) settings. |
| `excludedRoomIds` | number[] | Rooms (incl. city gates) pathing must avoid. |
| `landmarks` | object[] | Saved [landmarks](../landmarks.md). |
| `vibratingStick` | boolean | Wormhole vibrating-stick option. |
| `autoUpdate` | boolean | Self-update behavior. |
| `schemaVersion` | number | Settings schema version. |

## Reading and writing settings programmatically

```js
nexMap.settings.get();                 // current live settings (frozen)
nexMap.settings.updateDisplay({ labelMode: "id" });
nexMap.settings.updateTravelOptions({ pathingMode: "clientStep" });
nexMap.settings.reset();               // restore defaults (recoverable)
```

The verb conventions follow the ecosystem standard: `get` is a live in-memory
read, `update` is a partial merge, `replace` is a full overwrite, `reset`
restores defaults, and `clear` destroys the persisted entry. `set` is a legacy
alias for `replace`.

The dialog illustrates the current layout; the installed release remains the
authority for available controls and defaults.
