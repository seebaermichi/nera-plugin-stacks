# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
