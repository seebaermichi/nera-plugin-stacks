import path from 'path'
import fs from 'fs'
import pug from 'pug'
import pretty from 'pretty'

function loadStacks(pagesData) {
    const stacks = {}

    pagesData
        .filter(({ meta }) => meta.type === 'stack')
        .forEach(({ content, meta }) => {
            let renderedContent = content

            if (meta.stack_layout) {
                const layoutPath = path.resolve(
                    process.cwd(),
                    meta.stack_layout
                )

                if (fs.existsSync(layoutPath)) {
                    const template = pug.compileFile(layoutPath)
                    renderedContent = pretty(
                        template({
                            stack: {
                                meta,
                                content,
                            },
                        })
                    )
                } else {
                    console.warn(
                        `[Stacks Plugin] Stack layout not found: ${layoutPath}`
                    )
                }
            }

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
export function getAppData({ app, pagesData }) {
    const stacks = loadStacks(pagesData)
    return {
        ...app,
        stacks,
    }
}
