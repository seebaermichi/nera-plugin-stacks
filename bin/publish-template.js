#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pluginName = 'plugin-stacks'

const TEMPLATE_SRC = path.resolve(__dirname, '../views/stack-template.pug')
const TEMPLATE_DEST = path.resolve(
    process.cwd(),
    `views/vendor/${pluginName}/stack-template.pug`
)

const PACKAGE_JSON_PATH = path.resolve(process.cwd(), 'package.json')
const EXPECTED_PACKAGE_NAME = 'dummy' // for test-only override

const packageJsonExists = fs.existsSync(PACKAGE_JSON_PATH)
let shouldProceed = false

if (packageJsonExists) {
    try {
        const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'))
        shouldProceed =
            pkg.name === EXPECTED_PACKAGE_NAME || pkg.name.startsWith('nera')
    } catch (e) {
        console.error(`❌ Error reading package.json: ${e.message}`)
        shouldProceed = false
    }
}

if (!shouldProceed) {
    console.error(
        '❌ Please run this command from the root of your Nera project (where the plugin is installed).'
    )
    process.exit(1)
}

if (fs.existsSync(TEMPLATE_DEST)) {
    console.log(`⚠️ Template already exists at ${TEMPLATE_DEST}. Skipping.`)
    process.exit(0)
}

fs.mkdirSync(path.dirname(TEMPLATE_DEST), { recursive: true })
fs.copyFileSync(TEMPLATE_SRC, TEMPLATE_DEST)

console.log(`✅ Stack layout template copied to: ${TEMPLATE_DEST}`)
