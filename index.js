module.exports = (() => {
    const getAppData = data => {
        data.app.stacks = {}

        data.pagesData.filter(({ meta }) => meta.type ? meta.type === 'stack' : false)
            .forEach(({ content, meta }) => {
                const slug = meta.slug ? meta.slug : meta.title.toLowerCase().replace(/ /g, '_')

                data.app.stacks[slug] = { content, meta }
            })

        return data.app
    }

    return {
        getAppData
    }
})()
