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

### Using a template
It is also possible to use a template for the stacks content. With a template you have more control about how the 
content of the stack is rendered. To use this approach you of course need to provide a template. The meta section of 
your stack should then look like this.
```markdown
---
title: Using a stack template
description: A description which can also be used in the template for this stack.
type: stack
slug: stack_with_template
# Provide the whole path to your stack template, could also be something like:
# views/stacks/stack-layout.pug 
# if you add it to the projects view directory
stack_layout: src/plugins/stacks/views/stack-layout.pug
---
### Reuse me
This is content which can be reused easily on different pages. And it will use a given template to render it's content.

It can include any Markdown content.
```

The layout file for this stack can look like follows:
```jade
section.stack-wrapper
    header.stack-header
        h2 #{ stack.meta.title }
        p #{ stack.meta.description }
    article.stack-article
        | !{ stack.content }

```

The usage in your page template will be the same as for the normal stack:
```jade
//- ...
main
    | !{ app.stacks.stack_with_template.content }
    | //- other content
//- ...
```
