# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.1] - 2026-07-22

Full README audit against the code, plus the crash it uncovered. Everything
documented was verified by executing it — the hook against constructed page
data, the publish script in a temp project, and the template rendered through
the plugin's own `stack_layout` path.

### Fixed

-   **a non-string `title` no longer kills the build.** `meta.title?.toLowerCase()`
    guarded `null`/`undefined` but not a wrong type, so a stack page with
    `title: 2024`, `title: true`, or an unquoted `title: 2024-05-01` — which
    YAML parses into a **Date** — threw an uncaught
    `TypeError: meta.title?.toLowerCase is not a function` and produced no
    output at all. Numbers and booleans are now coerced (`2024`, `true`);
    a date, list or mapping is skipped with a named warning rather than
    stringified, because `String(aDate)` would become the public
    `app.stacks` key. Found by the fleet check during the
    `plugin-statistics` 2.2.1 release
-   **duplicate stack slugs now warn.** Two stacks resolving to the same slug
    still collapse into one, last page in build order winning — but it used to
    happen in total silence, and the symptom (a stack rendering the wrong
    content) points nowhere near the cause
-   the README claimed publishing "skips a template that already exists". The
    check is on the **directory** — if `views/vendor/plugin-stacks/` exists, the
    command copies nothing and still exits 0, even when the file inside it is
    missing. Documented accurately, including the fact that **upgrading never
    updates the published template** without `--force`
-   **Node.js** in Compatibility said `>= 18`; the real floor has been
    `>=20.0.0` since 2.3.0

### Added

-   a "What makes a page a stack" section: `type: stack` is now stated as a rule
    rather than only shown in examples, together with the two non-obvious
    consequences — omit `layout` unless you also want the stack published as its
    own page, and stack pages remain visible to every other plugin, so they can
    be counted, indexed or listed as ordinary content
-   documentation of three slug behaviours that were silent: only spaces are
    replaced (so `Hero: Big! Block` yields a key that dot access cannot reach),
    an explicit `slug` is used verbatim, and slugs share one global namespace
-   `## 📊 Generated Output` now gives the real shape of `app.stacks`
    (`{ [slug]: { content, meta } }`) and the actual rendered markup, generated
    from the shipped template and diffed against it, instead of a single
    sentence
-   `## 🤝 Contributing`, linking to the Nera contributing guide
-   `**Plugin Utils**: ^1.2.0` in Compatibility, noting it backs the publish
    command rather than the build-time hook
-   a statement that the BEM class names are a public contract, and a note that
    `.stack__description` renders even when the frontmatter has no
    `description`, leaving an empty `<p>`

### Changed

-   Development uses `npx vitest run`; `npm test` is Vitest in watch mode and
    never exits
-   the Nera compatibility line names v4.1.0 as a baseline rather than an
    unexplained requirement

### Migration from v2.3.0

Nothing to do for a site that builds today, and **no template markup changed** —
you do not need to re-publish templates for this release.

The slug rule is unchanged for every input that produced a slug before: strings
lowercase with spaces to underscores, explicit slugs verbatim, punctuation and
accents preserved. Verified across the full input matrix. The only pages whose
outcome changes are ones that previously **crashed the build**:

-   `title: 2024` or `title: true` — the stack is now included, keyed `2024` /
    `true`.
-   `title: 2024-05-01` (a Date), or a list/mapping title — the stack is now
    skipped with a warning. Quote the value, or set an explicit `slug`, to
    include it.

If your build already succeeded, none of these applied to it.

## [2.3.0] - 2026-07-21

### Changed

-   raised minimum Node from 18 to 20; Node 18 reached end-of-life on
    2025-04-30 and the dev toolchain requires Node 20+


## [2.2.0] - 2026-07-20

### Fixed

-   **`pug` is now declared as a runtime dependency.** It sat in
    `devDependencies` while `index.js` imports it at the top level, so in a
    project that did not happen to hoist pug the **entire plugin failed to
    load** — not just pages using `stack_layout`. Verified from a clean-room
    tarball install: `ERR_MODULE_NOT_FOUND: pug`. Declared at `^3.0.2` to match
    the generator's own range and avoid a duplicate pug install
-   a `stack_layout` that exists but fails to compile — a pug syntax error, an
    unresolvable include — no longer throws a raw pug error and kill the build.
    It warns with the offending path and falls back to the stack's unrendered
    content, matching what the missing-layout branch already did
-   a missing or non-array `pagesData` returns empty stacks instead of throwing
    `Cannot read properties of undefined (reading 'filter')`
-   a page with no `meta` no longer throws

### Added

-   `--force` flag on `nera-stacks`, to re-publish the template over an existing
    `views/vendor/plugin-stacks/` and discard local edits. Without it,
    publishing still skips
-   the README now documents the stack key convention: `app.stacks.<slug>`,
    where an absent `slug` is derived from the title with **underscores**

### Changed

-   `@nera-static/plugin-utils` raised to `^1.2.0`
-   CI runs Node 20 and 22 with `fail-fast: false`. The Node 18 leg failed on
    `main` regardless of any source change, because the dev-only `cheerio`
    dependency needs a global `File`. `engines` stays `>=18`: consumers never
    install devDependencies, and this plugin's own runtime deps work there
-   `CHANGELOG.md` is now included in the published package

### Migration Guide

Backward-compatible with v2.1.0.

The slug convention was reviewed and **deliberately left alone**. Hyphenating it
to match `nera-plugin-tags` would have moved every auto-generated stack from
`app.stacks.my_stack` to `app.stacks.my-stack`, silently breaking any layout
referencing one. It is now pinned by a regression test and documented.

## [2.1.0] - 2025-07-19

### Added

-   Professional CHANGELOG.md for release tracking
-   Enhanced README.md with comprehensive documentation and examples
-   Support for Nera v4.1.0 static site generator
-   BEM (Block Element Modifier) CSS methodology for stack templates
-   Enhanced template publishing system via `bin/publish-template.js`
-   Comprehensive test suite with 4 tests covering all functionality

### Changed

-   Updated @nera-static/plugin-utils to v1.1.0 for improved compatibility
-   Improved package.json metadata and repository references
-   Enhanced code documentation and examples
-   Modernized CSS classes using BEM methodology:
    -   `.stack` (main stack container)
    -   `.stack__header` (stack header section)
    -   `.stack__title` (stack title element)
    -   `.stack__description` (stack description element)
    -   `.stack__content` (stack content area)

### Technical Details

-   Uses `getAppData()` function to provide global app-level stack data
-   Stacks are available in `app.stacks` for global template access
-   Full compatibility with Nera v4.1.0 plugin system
-   All tests passing (4/4)
-   Template publishing to `views/vendor/plugin-stacks/`
-   Support for custom layout templates via `stack_layout` frontmatter
-   Automatic slug generation from stack titles

## [2.0.0] - 2024-07-19

### Added

-   Initial stable release for Nera static site generator
-   Reusable content stacks with template-based rendering
-   Support for custom layout templates via `stack_layout` frontmatter
-   Automatic slug generation from stack titles
-   Built-in Pug template with clean markup
-   Template publishing system
-   Pretty HTML formatting for rendered output
-   Comprehensive test coverage

### Features

-   Create reusable content components
-   Template-based stack rendering
-   Custom layout support
-   Slug-based stack identification
-   Integration with @nera-static/plugin-utils

### Dependencies

-   Node.js >=18 support
-   ES modules architecture
-   Modern development tooling (Vitest, ESLint, Husky)
