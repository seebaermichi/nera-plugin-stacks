import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest'

const TEST_ROOT = path.resolve('.tmp/publish-template-test')
const SCRIPT_PATH = path.resolve('bin/publish-template.js')
const TEMPLATE_SRC = path.resolve('views/stack-template.pug')
const TEMPLATE_DEST = path.join(
    TEST_ROOT,
    'views/vendor/plugin-stacks/stack-template.pug'
)
const DUMMY_PACKAGE = path.join(TEST_ROOT, 'package.json')

// Track whether we created the template file during this test
let createdTemplateSrc = false

beforeEach(() => {
    // Clean test workspace
    fs.rmSync(TEST_ROOT, { recursive: true, force: true })
    fs.mkdirSync(TEST_ROOT, { recursive: true })
    fs.writeFileSync(DUMMY_PACKAGE, JSON.stringify({ name: 'dummy' }, null, 2))

    // Only create the template source if it doesn't already exist
    if (!fs.existsSync(TEMPLATE_SRC)) {
        fs.mkdirSync(path.dirname(TEMPLATE_SRC), { recursive: true })
        fs.writeFileSync(TEMPLATE_SRC, 'section.stack-wrapper Template content')
        createdTemplateSrc = true
    }
})

afterEach(() => {
    fs.rmSync(TEST_ROOT, { recursive: true, force: true })

    // Only delete the test-created template source file, not the views directory!
    if (createdTemplateSrc && fs.existsSync(TEMPLATE_SRC)) {
        fs.unlinkSync(TEMPLATE_SRC)
        createdTemplateSrc = false
    }
})

describe('publish-template command', () => {
    it('copies the template to the correct location', () => {
        execSync(`node ${SCRIPT_PATH}`, { cwd: TEST_ROOT })

        expect(fs.existsSync(TEMPLATE_DEST)).toBe(true)

        const content = fs.readFileSync(TEMPLATE_DEST, 'utf-8')
        expect(content).toMatch(/section\.stack/)
    })

    it('skips if template already exists', () => {
        fs.mkdirSync(path.dirname(TEMPLATE_DEST), { recursive: true })
        fs.writeFileSync(TEMPLATE_DEST, '// existing')

        const output = execSync(`node ${SCRIPT_PATH}`, {
            cwd: TEST_ROOT,
            stdio: 'pipe',
        }).toString()

        expect(output).toMatch(/Skipping/i)
        const finalContent = fs.readFileSync(TEMPLATE_DEST, 'utf-8')
        expect(finalContent).toBe('// existing')
    })
})

afterAll(() => {
    fs.rmSync(path.resolve('.tmp'), { recursive: true, force: true })
})
