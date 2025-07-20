# @nera-static/plugin-stacks

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
npx @nera-static/plugin-stacks run publish-template
```

This copies the layout to:

```
views/vendor/plugin-stacks/stack-template.pug
```

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

## 📊 Generated Output

The plugin injects rendered HTML and metadata into `app.stacks`. You can output this manually or via a layout defined in frontmatter.

## 🧪 Development

```bash
npm install
npm test
npm run lint
```

Tests use [Vitest](https://vitest.dev) and cover:

- Stack discovery and rendering
- Layout integration
- Template publishing and overwrite handling

## 🧑‍💻 Author

Michael Becker
[https://github.com/seebaermichi](https://github.com/seebaermichi)

## 🔗 Links

- [Plugin Repository](https://github.com/seebaermichi/nera-plugin-stacks)
- [NPM Package](https://www.npmjs.com/package/@nera-static/plugin-stacks)
- [Nera Static Site Generator](https://github.com/seebaermichi/nera)

## 🧩 Compatibility

- **Nera**: v4.1.0+
- **Node.js**: >= 18
- **Plugin API**: Uses `getAppData()` to expose stack data

## 📦 License

MIT
