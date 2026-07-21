# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
