import path from 'path'
import fs from 'fs'
import pug from 'pug'
import pretty from 'pretty'

/**
 * Derives the `app.stacks` key for one stack page.
 *
 * An explicit `slug` wins and is used **verbatim** — no lowercasing, no space
 * replacement. That is long-standing behaviour and is documented; normalising
 * it now would silently move existing stacks.
 *
 * Otherwise the key comes from the title: lowercased, spaces to underscores,
 * everything else left alone. Underscores are deliberate — this key is an
 * object key users reference from their own layouts, not a URL fragment, so it
 * must NOT go through the shared `slugify()`; hyphenating would move every
 * auto-generated stack. Pinned by a regression test.
 *
 * Frontmatter is YAML, so `title` is not necessarily a string. `title: 2024`
 * parses to a Number, `title: true` to a Boolean, and — easiest to hit by
 * accident — an unquoted `title: 2024-05-01` to a **Date**. Calling
 * `.toLowerCase()` on any of those threw an uncaught TypeError and killed the
 * entire build.
 *
 * Numbers and booleans are coerced: they have an obvious, useful key form.
 * Anything else (Date, mapping, list) is skipped with a warning rather than
 * stringified, because `String(aDate)` yields a key nobody wants as public API
 * and `app.stacks[key]` is public API. This matches how `plugin-tags` handles a
 * non-scalar tag, and the "one bad page should not take the build down"
 * philosophy already used for stack layouts below.
 */
function getStackSlug(meta) {
    if (meta.slug) {
        return meta.slug
    }

    const { title } = meta

    if (title == null || title === '') {
        return undefined
    }

    if (
        typeof title === 'string' ||
        typeof title === 'number' ||
        typeof title === 'boolean'
    ) {
        return String(title).toLowerCase().replace(/ /g, '_')
    }

    const kind = title instanceof Date ? 'a date' : `an ${typeof title}`

    console.warn(
        `[Stacks Plugin] Ignoring a stack whose title is ${kind} — set an explicit string \`slug\`, or quote the title, to include it.`
    )

    return undefined
}

function loadStacks(pagesData) {
    const stacks = {}

    pagesData
        .filter(({ meta }) => meta?.type === 'stack')
        .forEach(({ content, meta }) => {
            let renderedContent = content

            if (meta.stack_layout) {
                const layoutPath = path.resolve(
                    process.cwd(),
                    meta.stack_layout
                )

                if (fs.existsSync(layoutPath)) {
                    // A layout that exists can still fail to compile — a pug
                    // syntax error, or an include that cannot be resolved.
                    // One bad layout should not take the whole build down, so
                    // warn with the offending path and fall back to the
                    // unrendered content, matching the not-found branch below.
                    try {
                        const template = pug.compileFile(layoutPath)
                        renderedContent = pretty(
                            template({
                                stack: {
                                    meta,
                                    content,
                                },
                            })
                        )
                    } catch (error) {
                        console.warn(
                            `[Stacks Plugin] Failed to render stack layout ${layoutPath}: ${error.message}`
                        )
                    }
                } else {
                    console.warn(
                        `[Stacks Plugin] Stack layout not found: ${layoutPath}`
                    )
                }
            }

            const slug = getStackSlug(meta)

            if (slug) {
                // Slugs are a single global namespace, so two stacks titled
                // "Introduction" in different directories collapse into one.
                // Last page in build order wins — keeping that behaviour, but
                // it used to happen in total silence, and the symptom (a stack
                // rendering the wrong content) points nowhere near the cause.
                if (Object.prototype.hasOwnProperty.call(stacks, slug)) {
                    console.warn(
                        `[Stacks Plugin] Duplicate stack slug "${slug}" — the later page overwrites the earlier one. Set an explicit \`slug\` to keep both.`
                    )
                }

                stacks[slug] = {
                    content: renderedContent,
                    meta,
                }
            }
        })

    return stacks
}

/**
 * Returns modified app data with stacks.
 * @param {object} param - Object containing app and pagesData
 * @param {object} param.app - App data object
 * @param {object[]} param.pagesData - Array of page data objects
 * @returns {object} Modified app data with stacks
 */
export function getAppData({ app, pagesData } = {}) {
    // Same guard as page-pagination:54 and page-navigation:41. Without it a
    // missing pagesData surfaced as `Cannot read properties of undefined`.
    const stacks = Array.isArray(pagesData) ? loadStacks(pagesData) : {}

    return {
        ...app,
        stacks,
    }
}
