import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { getAppData } from '../index.js'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// index.js resolves `stack_layout` through process.cwd(), so tests that touch a
// layout need a controlled cwd rather than the repo root.
let tmpDir
let originalCwd

beforeAll(() => {
    originalCwd = process.cwd()
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nera-stacks-'))
    fs.mkdirSync(path.join(tmpDir, 'views'), { recursive: true })
    fs.copyFileSync(
        path.join(REPO_ROOT, 'views/stack-template.pug'),
        path.join(tmpDir, 'views/stack-template.pug')
    )
    fs.writeFileSync(
        path.join(tmpDir, 'views/broken.pug'),
        'div\n  p= stack.meta.title\n        badly indented\n  - throw new Error("boom")\n'
    )
    process.chdir(tmpDir)
})

afterAll(() => {
    process.chdir(originalCwd)
    fs.rmSync(tmpDir, { recursive: true, force: true })
})

const stackPage = (meta, content = '<p>content</p>') => ({
    content,
    meta: { type: 'stack', ...meta },
})

describe('Stacks plugin', () => {
    it('adds a basic stack to app data', () => {
        const result = getAppData({
            app: { title: 'Test App' },
            pagesData: [
                stackPage(
                    { title: 'Basic Stack', slug: 'basic_stack' },
                    '<h3>Reusable content</h3><p>Details...</p>'
                ),
            ],
        })

        expect(result.stacks.basic_stack).toBeDefined()
        expect(result.stacks.basic_stack.content).toContain('Reusable content')
    })

    it('renders stack using a layout template', () => {
        const result = getAppData({
            app: { title: 'Test App' },
            pagesData: [
                stackPage(
                    {
                        title: 'With Template',
                        description: 'Stack description',
                        slug: 'template_stack',
                        stack_layout: 'views/stack-template.pug',
                    },
                    '<h3>Stack with template</h3>'
                ),
            ],
        })

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

    it('preserves other app properties', () => {
        const result = getAppData({
            app: { title: 'Test App', lang: 'en' },
            pagesData: [],
        })

        expect(result.title).toBe('Test App')
        expect(result.lang).toBe('en')
        expect(result.stacks).toEqual({})
    })

    it('ignores pages that are not stacks', () => {
        const result = getAppData({
            app: {},
            pagesData: [
                { content: '<p>a</p>', meta: { title: 'Normal Page' } },
                stackPage({ title: 'A Stack' }),
            ],
        })

        expect(Object.keys(result.stacks)).toEqual(['a_stack'])
    })
})

describe('slug generation', () => {
    // The slug is the key in `app.stacks[slug]`, referenced directly from user
    // layouts and documented with underscores in README.md. Changing it to
    // hyphens would silently move every auto-generated stack, so this test
    // exists to make that break loudly if anyone tries.
    it('derives an underscored slug from the title', () => {
        const result = getAppData({
            app: {},
            pagesData: [stackPage({ title: 'My Great Stack' })],
        })

        expect(Object.keys(result.stacks)).toEqual(['my_great_stack'])
    })

    it('prefers an explicit slug over the title', () => {
        const result = getAppData({
            app: {},
            pagesData: [stackPage({ title: 'My Stack', slug: 'custom' })],
        })

        expect(Object.keys(result.stacks)).toEqual(['custom'])
    })

    it('skips a stack that has neither slug nor title', () => {
        const result = getAppData({ app: {}, pagesData: [stackPage({})] })

        expect(result.stacks).toEqual({})
    })
})

describe('malformed input', () => {
    it('returns empty stacks when pagesData is missing', () => {
        expect(getAppData({ app: { title: 'x' } })).toEqual({
            title: 'x',
            stacks: {},
        })
    })

    it('returns empty stacks when pagesData is not an array', () => {
        expect(getAppData({ app: {}, pagesData: 'nope' }).stacks).toEqual({})
    })

    it('tolerates being called with no argument at all', () => {
        expect(getAppData()).toEqual({ stacks: {} })
    })

    it('tolerates a page with no meta', () => {
        expect(() =>
            getAppData({ app: {}, pagesData: [{ content: '<p>x</p>' }] })
        ).not.toThrow()
    })

    it('warns and keeps raw content when the layout does not exist', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

        const result = getAppData({
            app: {},
            pagesData: [
                stackPage(
                    { title: 'Missing', stack_layout: 'views/nope.pug' },
                    '<p>fallback</p>'
                ),
            ],
        })

        expect(result.stacks.missing.content).toBe('<p>fallback</p>')
        expect(warn.mock.calls[0][0]).toContain('Stack layout not found')
        expect(warn.mock.calls[0][0]).toContain('views/nope.pug')

        warn.mockRestore()
    })

    it('warns and keeps raw content when the layout fails to compile', () => {
        // A layout can exist and still be unusable — a pug syntax error, or an
        // unresolvable include. That used to throw a raw pug error and take the
        // whole build down.
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

        const result = getAppData({
            app: {},
            pagesData: [
                stackPage(
                    { title: 'Broken', stack_layout: 'views/broken.pug' },
                    '<p>fallback</p>'
                ),
            ],
        })

        expect(result.stacks.broken.content).toBe('<p>fallback</p>')
        expect(warn.mock.calls[0][0]).toContain('Failed to render stack layout')
        expect(warn.mock.calls[0][0]).toContain('views/broken.pug')

        warn.mockRestore()
    })
})
