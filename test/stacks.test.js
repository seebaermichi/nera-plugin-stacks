import { describe, it, expect } from 'vitest'
import { getAppData } from '../index.js'

describe('Stacks plugin', () => {
    it('adds a basic stack to app data', () => {
        const app = { title: 'Test App' }
        const pagesData = [
            {
                content: '<h3>Reusable content</h3><p>Details...</p>',
                meta: {
                    title: 'Basic Stack',
                    type: 'stack',
                    slug: 'basic_stack',
                },
            },
        ]

        const result = getAppData({ app, pagesData })
        expect(result.stacks.basic_stack).toBeDefined()
        expect(result.stacks.basic_stack.content).toContain('Reusable content')
    })

    it('renders stack using a layout template', () => {
        const app = { title: 'Test App' }
        const pagesData = [
            {
                content: '<h3>Stack with template</h3>',
                meta: {
                    title: 'With Template',
                    description: 'Stack description',
                    type: 'stack',
                    slug: 'template_stack',
                    stack_layout: 'views/stack-template.pug',
                },
            },
        ]

        const result = getAppData({ app, pagesData })
        const stackHtml = result.stacks.template_stack.content

        expect(stackHtml).toContain('<section')
        expect(stackHtml).toContain(
            '<h2 class="stack__title">With Template</h2>'
        )
        expect(stackHtml).toContain(
            '<p class="stack__description">Stack description</p>'
        )
        expect(stackHtml).toContain('<h3>Stack with template</h3>')
    })
})
