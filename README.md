# @nera-static/plugin-stacks

A plugin for the [Nera](https://github.com/seebaermichi/nera) static site generator that allows you to define reusable content blocks (called "stacks") in Markdown. These blocks can be embedded into any page or layout — and optionally rendered using a custom template.

## ✨ Features

-   Define reusable Markdown content anywhere in the `pages/` directory
-   Access stack data globally in your views via `app.stacks`
-   Use optional templates (`.pug`) to customize rendering per stack
-   Includes a publishable default template to get started quickly
-   Supports all frontmatter meta fields inside templates

## 🚀 Installation

Install the plugin in your Nera project:

```bash
npm install @nera-static/plugin-stacks
```

Nera will automatically detect the plugin, no additional setup or imports are required.

## 📦 Usage

Create a Markdown file inside `pages/`:

```markdown
---
title: Some reusable content
type: stack
slug: some_reusable_content
---

### Reuse me

This is content which can be reused easily on different pages.
```

> ⚠️ Do **not** include a `layout` property in the frontmatter — stacks are not rendered to separate HTML files.

You can now include it in your views:

```pug
aside
    h2 #{ app.stacks.some_reusable_content.meta.title }
    | !{ app.stacks.some_reusable_content.content }
```

All frontmatter fields (like `description`) are accessible via `app.stacks.<slug>.meta`.

## 🧩 Stack Templates (Optional)

You can render stacks using a custom Pug template:

```markdown
---
title: Using a stack template
description: A custom description
type: stack
slug: stack_with_template
stack_layout: views/stacks/stack-layout.pug
---

### Reuse me

This content will be rendered using the provided layout.
```

Example template (`views/stacks/stack-layout.pug`):

```pug
section.stack-wrapper
    header.stack-header
        h2 #{ stack.meta.title }
        p #{ stack.meta.description }
    article.stack-article
        | !{ stack.content }
```

The usage in your views stays the same:

```pug
main
    | !{ app.stacks.stack_with_template.content }
```

## 🛠️ Publish Default Template

Use the default template provided by the plugin:

```bash
npx @nera-static/plugin-stacks run publish-template
```

This copies the template to:

```
views/vendor/plugin-stacks/stack-template.pug
```

You can then use it in your stack frontmatter like so:

```yaml
stack_layout: views/vendor/plugin-stacks/stack-template.pug
```

## 🧪 Development

```bash
npm install
npm test
```

Tests are powered by [Vitest](https://vitest.dev) and cover:

-   Loading and rendering of stack data
-   Template rendering support
-   Template publishing logic and file overwrite prevention

## 🧑‍💻 Author

Michael Becker  
[https://github.com/seebaermichi](https://github.com/seebaermichi)

## 🔗 Links

-   [Plugin Repository](https://github.com/seebaermichi/nera-plugin-stacks)
-   [NPM Package](https://www.npmjs.com/package/@nera-static/plugin-stacks)
-   [Nera Static Site Generator](https://github.com/seebaermichi/nera)

## 📄 License

MIT
