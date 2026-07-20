import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFileSync } from 'child_process'
import { fileURLToPath } from 'url'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

const REPO_ROOT = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..'
)
const SCRIPT_PATH = path.join(REPO_ROOT, 'bin/publish-template.js')
const TEMPLATE_SRC = path.join(REPO_ROOT, 'views/stack-template.pug')

// The workspace lives in os.tmpdir() rather than <repo>/.tmp so a crashed run
// cannot leave anything behind inside the repo.
let testRoot
let templateDest

const run = (...args) =>
    execFileSync('node', [SCRIPT_PATH, ...args], {
        cwd: testRoot,
        stdio: 'pipe',
    }).toString()

beforeEach(() => {
    testRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nera-stacks-publish-'))

    // Looks like a Nera project, which is what validateNeraProject checks for
    // as of plugin-utils 1.2.0 (D4). The bin no longer passes the
    // `expectedPackageName: 'dummy'` test-only override.
    fs.writeFileSync(
        path.join(testRoot, 'package.json'),
        JSON.stringify({ name: 'my-site' })
    )
    fs.mkdirSync(path.join(testRoot, 'config'), { recursive: true })
    fs.writeFileSync(path.join(testRoot, 'config/app.yaml'), 'lang: en\n')
    fs.mkdirSync(path.join(testRoot, 'pages'), { recursive: true })

    templateDest = path.join(
        testRoot,
        'views/vendor/plugin-stacks/stack-template.pug'
    )
})

afterEach(() => {
    fs.rmSync(testRoot, { recursive: true, force: true })
})

describe('publish-template command', () => {
    it('copies the template to the correct location', () => {
        run()

        expect(fs.existsSync(templateDest)).toBe(true)
        expect(fs.readFileSync(templateDest, 'utf-8')).toBe(
            fs.readFileSync(TEMPLATE_SRC, 'utf-8')
        )
    })

    it('skips if template already exists', () => {
        fs.mkdirSync(path.dirname(templateDest), { recursive: true })
        fs.writeFileSync(templateDest, '// existing')

        expect(run()).toMatch(/Skipping/i)
        expect(fs.readFileSync(templateDest, 'utf-8')).toBe('// existing')
    })

    it('overwrites an existing template when --force is passed', () => {
        fs.mkdirSync(path.dirname(templateDest), { recursive: true })
        fs.writeFileSync(templateDest, '// existing')

        run('--force')

        expect(fs.readFileSync(templateDest, 'utf-8')).toBe(
            fs.readFileSync(TEMPLATE_SRC, 'utf-8')
        )
    })

    it('refuses to publish outside a Nera project', () => {
        fs.rmSync(path.join(testRoot, 'config/app.yaml'))
        fs.rmSync(path.join(testRoot, 'pages'), { recursive: true })

        expect(() => run()).toThrow()
        expect(fs.existsSync(templateDest)).toBe(false)
    })
})
