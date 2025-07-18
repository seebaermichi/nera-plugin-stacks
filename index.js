import path from 'path'
import fs from 'fs'
import pug from 'pug'
import pretty from 'pretty'

export function getAppData(data) {
    data.app.stacks = {}

    data.pagesData
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
                data.app.stacks[slug] = {
                    content: renderedContent,
                    meta,
                }
            }
        })

    return data.app
}
