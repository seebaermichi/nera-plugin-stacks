# Stacks - Nera plugin
This is a plugin for the static side generator [Nera](https://github.com/seebaermichi/nera) to create content with 
Markdown which can be reused on many different pages.

## Usage
At first, you need to place this plugin in the `src/plugins` folder of your Nera project.  

Without any further configuration you can use stacks by just creating some Markdown files within the `pages` 
directory of your Nera project. The meta section of these Markdown files must include at least the following:
```markdown
---
title: Some reusable content
type: stack
slug: some_reusable_content
---
### Reuse me
This is content which can be reused easily on different pages.

It can include any Markdown content.
```
> Make sure to not include the layout property in the meta section, so that Nera doesn't compile this to a HTML file.

Now you can use this stack in your template files, e.g. in a sidebar.
```jade
//- ...
aside
    h2 #{ app.stacks.some_reusable_content.meta.title }
    | !{ app.stacks.some_reusable_content.content }
//- ...
```
Whatever meta property is given in the Markdown file, can also be used in the view.
