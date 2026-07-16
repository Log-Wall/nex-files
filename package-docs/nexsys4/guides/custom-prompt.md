---
title: Custom prompt
description: Enable and replace the nexSys4 prompt layout.
---

# Custom prompt

Enable prompt replacement with **Custom Prompt** on the System tab or through
JavaScript:

```js
nexSys.api.prompt.enabled = true;
```

## Replace the prompt layout

`nexSys.api.prompt.set(fn)` is the single entry point for a user-defined prompt
layout. The function receives a fresh builder and runs once for every real
prompt render, after the current output block has been applied to nexSys state.

```js
nexSys.api.prompt.set((b) => {
  const { vars } = b;

  if (vars.blackout) {
    b.add("-");
    return;
  }

  b.add("h");
  b.add(`(${vars.ph.text}) `, vars.h.fg, vars.h.bg);
  b.add("m");
  b.add(`(${vars.pm.text}) `, vars.m.fg, vars.m.bg);

  if (nexSys.api.class.is("Occultist")) {
    b.add(`${vars.karma.text}K `, vars.karma.fg, vars.karma.bg);
  }

  b.add("eq").add("bal").add(" ").addAffs().addDiff();
});
```

Because the function is reevaluated for every prompt, conditions may read
current class state, Nexus alias flags, or other live public nexSys state. No
manual dirty or repaint call is required.

The builder exposes:

- `b.vars`, `b.affs`, and `b.cureColors`
- `b.add(keyOrLiteral, fg?, bg?)`
- `b.addHTML(html)`
- `b.addAffs()`
- `b.addDiff()`
- `b.addTarget()`

`addHTML()` accepts trusted raw HTML. Prefer `add()` for normal text.

## Restore the shipped layout

```js
nexSys.api.prompt.reset();
```

If a user layout throws, nexSys logs the error, discards partial custom output,
and renders the shipped layout for that prompt. The user layout remains active
and will be tried again at the next prompt.

## Update presentation values

The prompt presenter exposes three live configuration buckets:

- `vars` for render values and colors
- `affs` for affliction abbreviations and colors
- `cureColors` for the named color palette

Use the public update methods to change them:

```js
const { prompt } = nexSys.api;

prompt.updateVars({ h: { fg: "lime" } });
prompt.updateAffs({ asthma: { text: "AST", fg: "gold" } });
prompt.updateCureColors({ ferrum: { fg: "orange" } });
```

Read the current snapshot at `nexSys.state.prompt`. Calling `prompt.reset()`
restores the shipped layout function; it does not undo presentation updates.
