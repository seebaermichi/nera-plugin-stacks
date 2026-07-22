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

    it('replaces spaces only, preserving punctuation and accents', () => {
        // Documented in the README: the key can therefore be one that dot
        // access cannot reach, e.g. app.stacks['hero:_big!_block'].
        const result = getAppData({
            app: {},
            pagesData: [
                stackPage({ title: 'Hero: Big! Block' }),
                stackPage({ title: 'Über uns' }),
            ],
        })

        expect(Object.keys(result.stacks)).toEqual([
            'hero:_big!_block',
            'über_uns',
        ])
    })

    it('uses an explicit slug verbatim, without normalising it', () => {
        const result = getAppData({
            app: {},
            pagesData: [stackPage({ title: 'x', slug: 'my slug' })],
        })

        expect(Object.keys(result.stacks)).toEqual(['my slug'])
    })
})

describe('non-string titles', () => {
    // Frontmatter is YAML, so `title` is not necessarily a string. Calling
    // .toLowerCase() on a Number, Boolean or Date threw an uncaught TypeError
    // and killed the whole build.
    it('coerces a numeric title instead of throwing', () => {
        const result = getAppData({
            app: {},
            pagesData: [stackPage({ title: 2024 })],
        })

        expect(Object.keys(result.stacks)).toEqual(['2024'])
    })

    it('coerces a boolean title instead of throwing', () => {
        const result = getAppData({
            app: {},
            pagesData: [stackPage({ title: true })],
        })

        expect(Object.keys(result.stacks)).toEqual(['true'])
    })

    it('warns and skips a Date title rather than minting a grotesque key', () => {
        // An unquoted `title: 2024-05-01` is parsed into a Date by the YAML
        // loader, so this is the easiest of the three to hit by accident.
        // String(aDate) would become the public app.stacks key.
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

        const result = getAppData({
            app: {},
            pagesData: [stackPage({ title: new Date('2024-05-01') })],
        })

        expect(result.stacks).toEqual({})
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('title is a date')
        )

        warn.mockRestore()
    })

    it('warns and skips a mapping title', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

        const result = getAppData({
            app: {},
            pagesData: [stackPage({ title: { a: 1 } })],
        })

        expect(result.stacks).toEqual({})
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('title is an object')
        )

        warn.mockRestore()
    })

    it('still honours an explicit slug when the title is unusable', () => {
        const result = getAppData({
            app: {},
            pagesData: [
                stackPage({ title: new Date('2024-05-01'), slug: 'ok' }),
            ],
        })

        expect(Object.keys(result.stacks)).toEqual(['ok'])
    })

    it('does not throw for any title type', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

        expect(() =>
            getAppData({
                app: {},
                pagesData: [
                    stackPage({ title: 2024 }),
                    stackPage({ title: false }),
                    stackPage({ title: new Date() }),
                    stackPage({ title: { a: 1 } }),
                    stackPage({ title: ['a'] }),
                    stackPage({ title: null }),
                ],
            })
        ).not.toThrow()

        warn.mockRestore()
    })
})

describe('duplicate slugs', () => {
    it('keeps the last page and warns about the collision', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

        const result = getAppData({
            app: {},
            pagesData: [
                stackPage({ title: 'Dup' }, '<p>FIRST</p>'),
                stackPage({ title: 'Dup' }, '<p>SECOND</p>'),
            ],
        })

        expect(Object.keys(result.stacks)).toEqual(['dup'])
        expect(result.stacks.dup.content).toBe('<p>SECOND</p>')
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('Duplicate stack slug "dup"')
        )

        warn.mockRestore()
    })

    it('does not warn when slugs are distinct', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

        getAppData({
            app: {},
            pagesData: [
                stackPage({ title: 'One' }),
                stackPage({ title: 'Two' }),
            ],
        })

        expect(warn).not.toHaveBeenCalled()

        warn.mockRestore()
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
