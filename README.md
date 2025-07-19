# @nera-static/plugin-stacks

A plugin for the [Nera](https://github.com/seebaermichi/nera) static site generator that allows you to define reusable content blocks (called "stacks") in Markdown. These blocks can be embedded into any page or layout — and optionally rendered using a custom template.

## ✨ Features

-   Define reusable Markdown content anywhere in the `pages/` directory
-   Access stack data globally in your views via `app.stacks`
-   Use optional templates (`.pug`) to customize rendering per stack
-   Includes a publishable default template to get started quickly
-   Supports all frontmatter meta fields inside templates
-   BEM CSS methodology for consistent styling

## 🚀 Installation

Install the plugin in your Nera project:

```bash
npm install @nera-static/plugin-stacks
```

Nera will automatically detect the plugin, no additional setup or imports are required.

## Usage

After installation, stacks can be used in all templates via `app.stacks`:

```pug
// In any template
div
    // Basic stack without layout
    != app.stacks.basic_stack.content

    // Stack with custom template
    != app.stacks.template_stack.content
```

**JavaScript/Template Access:**

```javascript
// Access a stack
const stack = app.stacks.my_stack
console.log(stack.content) // Rendered HTML
console.log(stack.meta) // Original metadata
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
npm run lint
```

Tests are powered by [Vitest](https://vitest.dev) and cover:

-   Loading and rendering of stack data
-   Template rendering support
-   Template publishing logic and file overwrite prevention

### 🔄 Compatibility

-   **Nera v4.1.0+**: Full compatibility with latest static site generator
-   **Node.js 18+**: Modern JavaScript features and ES modules
-   **Plugin Utils v1.1.0+**: Enhanced plugin utilities integration

### 🏗️ Architecture

This plugin uses the `getAppData()` function to process page data and make stacks available via `app.stacks`. Stacks are identified by their slug and can be rendered using custom templates.

### 🎨 BEM CSS Classes

The default template uses BEM (Block Element Modifier) methodology:

-   `.stack` - Main stack container
-   `.stack__header` - Stack header section
-   `.stack__title` - Stack title element
-   `.stack__description` - Stack description element
-   `.stack__content` - Stack content area

## 🧑‍💻 Author

Michael Becker  
[https://github.com/seebaermichi](https://github.com/seebaermichi)

## 🔗 Links

-   [Plugin Repository](https://github.com/seebaermichi/nera-plugin-stacks)
-   [NPM Package](https://www.npmjs.com/package/@nera-static/plugin-stacks)
-   [Nera Static Site Generator](https://github.com/seebaermichi/nera)
-   [Plugin Documentation](https://github.com/seebaermichi/nera#plugins)

## 📄 License

MIT
