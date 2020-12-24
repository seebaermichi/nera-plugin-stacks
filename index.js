module.exports = (() => {
    const getAppData = data => {
        data.app.stacks = {}

        data.pagesData.filter(({ meta }) => meta.type ? meta.type === 'stack' : false)
            .forEach(({ content, meta }) => {
                if (meta.stack_layout) {
                    const pug = require('pug')
                    const pretty = require('pretty')

                    const fn = pug.compileFile(meta.stack_layout)
                    content = fn(Object.assign({}, { stack: { meta, content } }))
                    content = pretty(content)
                }

                const slug = meta.slug ? meta.slug : meta.title.toLowerCase().replace(/ /g, '_')

                data.app.stacks[slug] = { content, meta }
            })

        return data.app
    }

    return {
        getAppData
    }
})()
