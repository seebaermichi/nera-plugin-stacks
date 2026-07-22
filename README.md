# @nera-static/plugin-stacks

[![Test](https://github.com/seebaermichi/nera-plugin-stacks/actions/workflows/test.yml/badge.svg)](https://github.com/seebaermichi/nera-plugin-stacks/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/@nera-static/plugin-stacks)](https://www.npmjs.com/package/@nera-static/plugin-stacks)

A plugin for the [Nera](https://github.com/seebaermichi/nera) static site generator that allows you to define reusable content blocks ("stacks") in Markdown. These can be embedded in any page or layout and optionally rendered with a custom template.

## ✨ Features

- Define reusable Markdown blocks in the `pages/` directory
- Access all stacks via `app.stacks` in any view
- Optional Pug templates for customized stack rendering
- Frontmatter meta fields fully available in templates
- Publishable default template for quick integration
- BEM CSS methodology for styling consistency
- Lightweight and zero-runtime overhead
- Full compatibility with Nera v4.1.0+

## 🚀 Installation

Install the plugin in your Nera project:

```bash
npm install @nera-static/plugin-stacks
```

No further setup required — Nera will auto-detect the plugin.

## ⚙️ Configuration

No configuration file needed. Stacks are defined directly via frontmatter in Markdown files.

## 🧩 Usage

### What makes a page a stack

A stack is any Markdown file in `pages/` whose frontmatter sets **`type: stack`**
and provides either a `slug` or a `title`. The marker is an exact match — a page
without it is invisible to this plugin, which is the usual reason `app.stacks`
comes back empty.

Two consequences worth knowing, because neither is obvious:

- **Give stack pages no `layout`.** Nera renders a page to `public/` only if its
  frontmatter has one, so omitting `layout` keeps the stack a reusable fragment
  rather than also publishing it as its own page. Add a `layout` only if you
  genuinely want both.
- **Stack pages are still ordinary pages.** They stay in the page list every
  other plugin sees, so they can be counted by `plugin-statistics`, indexed by
  `plugin-search`, or listed by a navigation plugin. Exclude them there if you
  do not want fragments leaking into menus or search results.

### Frontmatter example

```markdown
---
title: Reusable Stack
slug: basic_stack
type: stack
---
Some content that will be reused in various templates.
```

### Stack with custom layout

```markdown
---
title: Stack with layout
description: A reusable section
slug: stack_with_template
type: stack
stack_layout: views/stacks/stack-layout.pug
---

### Hello Stack

This will be rendered with a layout.
```

### Stack keys

Each stack is exposed as `app.stacks[<slug>]`. The `slug` comes from frontmatter
when present; otherwise it is derived from the title by lowercasing it and
replacing spaces with **underscores** — `title: My Great Stack` becomes
`app.stacks.my_great_stack`.

This is a data-contract key you reference from your own layouts, not an HTML
anchor, so the underscore convention is deliberate and will not change. Set an
explicit `slug` if you want something else.

Four details that are easy to trip over:

- **Only spaces are replaced.** Punctuation and accents survive, lowercased, so
  `title: Hero: Big! Block` becomes the key `hero:_big!_block`. That is a valid
  object key but not a valid identifier, so it can only be read as
  `app.stacks['hero:_big!_block']` — dot access will not compile. Set an
  explicit `slug` for any title containing punctuation.
- **An explicit `slug` is used exactly as written** — no lowercasing, no space
  replacement. `slug: my slug` really does produce the key `my slug`.
- **Slugs are one global namespace.** Two stacks that resolve to the same slug
  collapse into one: the later page in build order wins, and the plugin warns.
  Set an explicit `slug` to keep both.
- **A non-string title.** Frontmatter is YAML, so `title: 2024` is a number and
  an unquoted `title: 2024-05-01` is a *date*. Numbers and booleans are used as
  keys (`2024`, `true`). A date, list or mapping cannot produce a sensible key,
  so the stack is skipped with a warning — quote the value, or set an explicit
  `slug`, to include it.

If a `stack_layout` is missing or fails to compile, the plugin warns with the
offending path and falls back to the stack's unrendered content rather than
failing the build.

### Example layout template

```pug
section.stack
  header.stack__header
    h2.stack__title #{ stack.meta.title }
    p.stack__description #{ stack.meta.description }
  article.stack__content
    | !{ stack.content }
```

## 🛠️ Template Publishing

Publish the default template:

```bash
npx nera-stacks
```

This copies the layout to:

```
views/vendor/plugin-stacks/stack-template.pug
```

> **Publishing skips the whole directory, not individual files.** If
> `views/vendor/plugin-stacks/` already exists, the command copies **nothing**
> and still exits successfully — even if you deleted the file inside it. This
> also means **upgrading the plugin never updates your published template.** To
> pull in a newer version, re-run with `--force`:
>
> ```bash
> npx nera-stacks --force
> ```
>
> `--force` overwrites every file in that directory and discards local edits, so
> diff your copy first if you have customised it.

Reference it in stack frontmatter:

```yaml
stack_layout: views/vendor/plugin-stacks/stack-template.pug
```

## 🎨 Styling

Default template uses BEM CSS classes:

```css
.stack { }
.stack__header { }
.stack__title { }
.stack__description { }
.stack__content { }
```

**These class names are a public contract.** You style them from your own CSS,
so renaming one here is a breaking change and ships as a **major** version.

Note that `.stack__description` is rendered unconditionally, so a stack with no
`description` in its frontmatter emits an empty `<p class="stack__description">`.
Either always set a description, style the empty case, or edit your published
copy of the template to guard the line.

## 📊 Generated Output

The plugin adds `app.stacks`, keyed by slug. Each entry holds the stack's
rendered `content` and its full frontmatter as `meta`:

```js
app.stacks = {
  basic_stack: {
    // the stack_layout output when one resolved, otherwise the page's own
    // markdown-rendered HTML
    content: '<section class="stack">…</section>',
    // every frontmatter key survives, including your own custom ones
    meta: { type: 'stack', title: 'Reusable Stack', slug: 'basic_stack', … }
  }
}
```

Rendering a stack through the shipped template produces:

```html
<section class="stack">
  <header class="stack__header">
    <h2 class="stack__title">T</h2>
    <p class="stack__description">D</p>
  </header>
  <article class="stack__content">
    <p>hi</p>
  </article>
</section>
```

Without a `stack_layout`, `content` is simply the page's rendered Markdown and
carries no `.stack` markup at all.

## 🧪 Development

```bash
npm install
npx vitest run
npm run lint
```

`npm test` starts Vitest in **watch** mode and does not exit; use `npx vitest run`
for a single pass.

Tests use [Vitest](https://vitest.dev) and cover:

- Stack discovery and rendering
- Layout integration
- Template publishing and overwrite handling

## 🤝 Contributing

Issues and pull requests are welcome. See the
[Nera contributing guide](https://github.com/seebaermichi/nera/blob/main/CONTRIBUTING.md)
for plugin development, the hook contract, and local setup.

For this repo specifically:

- `npx vitest run` and `npm run lint` must pass (`npm test` is watch mode).
- Bump the version and update `CHANGELOG.md` **in the same commit** as the change.
- Template markup and BEM class names are a **public contract** — users style
  them from their own CSS, so changing one is a **major** bump.
- The `app.stacks` key convention (lowercase, spaces to underscores) is equally
  a public contract: users reference `app.stacks[slug]` from their layouts.
- Releases publish from CI on a pushed `v*` tag. Never run `npm publish`.

## 🧑‍💻 Author

Michael Becker  
[https://github.com/seebaermichi](https://github.com/seebaermichi)

## 🔗 Links

- [Plugin Repository](https://github.com/seebaermichi/nera-plugin-stacks)
- [NPM Package](https://www.npmjs.com/package/@nera-static/plugin-stacks)
- [Nera Static Site Generator](https://github.com/seebaermichi/nera)

## 🧩 Compatibility

- **Nera**: v4.1.0+ — a baseline rather than a requirement; the plugin reads only
  page frontmatter and uses no generator feature above the 4.x line.
- **Node.js**: >= 20.0.0
- **Plugin Utils**: `^1.2.0` — used by the `npx nera-stacks` publish command
  (where `--force` landed), not by the plugin at build time.
- **Plugin API**: Uses `getAppData()` to expose stack data

## 📦 License

MIT
