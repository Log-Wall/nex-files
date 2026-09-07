---
title: Battlerage
description: How nexBash4 spends battlerage — the rage lane, reserves, and coupling.
---

# Battlerage

Battlerage is a second, parallel decision track. Where the primary lane fires on
each game prompt, the battlerage lane fires when your rage changes — and it uses
the same first-valid selection over an ordered lane. Ordinary candidates use
pure `canExecute` checks; explicit track policies such as Maya use a specialized
pure eligibility predicate (see [the decision model](./decision-model.md)).

## The rage lane

A class's `battlerage` lane is an ordered list of **Rage** actions. A Rage is an
Action with extra metadata:

| Field | Meaning |
| --- | --- |
| `rage` | The rage cost to use it. |
| `cd` | Cooldown in seconds. |
| `balance` | Whether it consumes battlerage balance. |
| `damaging` | Whether it deals denizen health damage. Maya spending and Rage pulling use this explicit classification. |
| `affliction` | The affliction it applies, if any. |
| `combo` | Afflictions that must be present for a combo rage. |
| `raze` | Whether it strips a shield. |
| `coupling` | When it fires relative to the attack: `preAttack` or `auto`. |

Edit the lane in the [Class Configuration](./configuration/class-configuration.md)
tab's **Battlerages** sub-tab. Classes without a battlerage lane simply omit that
sub-tab.

## Reserves (buffers)

You don't want nexBash to dump all your rage on minor damage and then be unable to
raze a shield. The three **reserves** keep rage in hand for the things that matter.
Set them on the [Options tab](./configuration/options.md):

| Reserve | Default | Keeps rage for |
| --- | --- | --- |
| Shield Buffer | 17 | A shield raze. |
| CC Buffer | 35 | A crowd-control rage. |
| General Buffer | 48 | General battlerage. |

A reserve is a floor, not a cost: a rage in a category is only allowed to spend
while your rage is above the matching reserve. These are read by the rage gates
through `ctx.battlerage.{shieldBuffer, ccBuffer, generalBuffer}`.

Crowd-control rages also require the active NPC's `ccMinAttackers` to be positive
and the current exact `ctx.attackerCount` to have reached that minimum. This
keeps an NPC's CC policy independent from the area's safety cap.

## Live battlerage state

Beyond the reserves, the rage gates read live flags each tick via
`ctx.battlerage`:

| Fact | Meaning |
| --- | --- |
| `balance` | You are on battlerage balance (ready to use a balance-consuming rage). |
| `freerage` | The free-rage defence is up — rage ignores cost and reserves. |
| `matic` | Automatic curing is active — battlerage is suppressed. |
| `razeReady` | A battlerage raze is legal right now (so the balance-raze stands down). |

nexBash keeps these current by reading the game's own recovery lines and GMCP.
Recovery text like *"You can use another Battlerage ability again…"* is folded
into the owned battlerage state through the
[`observe` boundary](../reference/api.md#apiobserve), and each named ability's
individual cooldown is tracked the same way.

## Coupling: when a rage fires

A rage's `coupling` decides its timing:

- **`preAttack`** — fires *before* the attack on the same prompt. Razes and the
  sensitivity opener use this so the attack lands into the new state.
- **`auto`** — fires autonomously on a rage/freerage change, independent of the
  attack.

Both tracks revalidate projected attackers at their queue boundary. A coupled
rage and primary attack are checked as one union; an autonomous rage performs
the same check on its own action. No rage command is queued when the latest room
roster would put the engagement above `maxAttackers`.

While Maya is available, the autonomous track stands down so the prompt-coupled
track owns the single battlerage balance. It chooses the cheapest explicitly
damaging ability in the active effective lane whose own cooldown is ready and
whose actual Rage cost is affordable. Ordinary buffers and tactical action gates
do not apply to this Maya spender.

## Rage and razing shields

When a target raises a shield, nexBash can break it in two ways: wait it out, or
spend rage to raze. The **Use rage to raze** option
([Options](./configuration/options.md)) enables the rage path, gated by the Shield
Buffer so it won't starve a more important rage. If a battlerage raze is queued,
the balance-raze path stands down (`ctx.battlerage.razeReady`) so the shield isn't
double-handled. Pair this with the **Swap on shield** option and per-NPC
**Can Shield** / **Can Raze** flags to control shield behavior precisely.

## Inspecting battlerage

```js
nexBash.state.battlerage;
// { balance, shieldBuffer, ccBuffer, generalBuffer }

nexBash.debug();
// logs each battlerage candidate with its rage cost, availability, and balance
```
