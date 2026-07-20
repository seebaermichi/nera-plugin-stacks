import path from 'path'
import fs from 'fs'
import pug from 'pug'
import pretty from 'pretty'

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

            // Underscores, deliberately. This slug is the key in
            // `app.stacks[slug]`, which users reference from their own
            // layouts — not an HTML anchor. Hyphenating to match `tags` would
            // silently move every auto-generated stack, so the convention is
            // pinned by a test and documented in the README instead.
            const slug =
                meta.slug || meta.title?.toLowerCase().replace(/ /g, '_')

            if (slug) {
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
