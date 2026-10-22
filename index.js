import path from 'path'
import fs from 'fs'
import pug from 'pug'
import pretty from 'pretty'

/**
 * Derives the `app.stacks` key for one stack page.
 *
 * An explicit `slug` wins and is used **verbatim** — no lowercasing, no space
 * replacement. That is long-standing behaviour and is documented; normalising
 * it now would silently move existing stacks.
 *
 * Otherwise the key comes from the title: lowercased, spaces to underscores,
 * everything else left alone. Underscores are deliberate — this key is an
 * object key users reference from their own layouts, not a URL fragment, so it
 * must NOT go through the shared `slugify()`; hyphenating would move every
 * auto-generated stack. Pinned by a regression test.
 *
 * Frontmatter is YAML, so `title` is not necessarily a string. `title: 2024`
 * parses to a Number, `title: true` to a Boolean, and — easiest to hit by
 * accident — an unquoted `title: 2024-05-01` to a **Date**. Calling
 * `.toLowerCase()` on any of those threw an uncaught TypeError and killed the
 * entire build.
 *
 * Numbers and booleans are coerced: they have an obvious, useful key form.
 * Anything else (Date, mapping, list) is skipped with a warning rather than
 * stringified, because `String(aDate)` yields a key nobody wants as public API
 * and `app.stacks[key]` is public API. This matches how `plugin-tags` handles a
 * non-scalar tag, and the "one bad page should not take the build down"
 * philosophy already used for stack layouts below.
 */
function getStackSlug(meta) {
    if (meta.slug) {
        return meta.slug
    }

    const { title } = meta

    if (title == null || title === '') {
        return undefined
    }

    if (
        typeof title === 'string' ||
        typeof title === 'number' ||
        typeof title === 'boolean'
    ) {
        return String(title).toLowerCase().replace(/ /g, '_')
    }

    const kind = title instanceof Date ? 'a date' : `an ${typeof title}`

    console.warn(
        `[Stacks Plugin] Ignoring a stack whose title is ${kind} — set an explicit string \`slug\`, or quote the title, to include it.`
    )

    return undefined
}

function renderStack({ content, meta }) {
    if (!meta.stack_layout) {
        return content
    }

    const layoutPath = path.resolve(process.cwd(), meta.stack_layout)

    if (!fs.existsSync(layoutPath)) {
        console.warn(`[Stacks Plugin] Stack layout not found: ${layoutPath}`)

        return content
    }

    // A layout that exists can still fail to compile — a pug syntax error, or
    // an include that cannot be resolved. One bad layout should not take the
    // whole build down, so warn with the offending path and fall back to the
    // unrendered content, matching the not-found branch above.
    try {
        const template = pug.compileFile(layoutPath)

        return pretty(template({ stack: { meta, content } }))
    } catch (error) {
        console.warn(
            `[Stacks Plugin] Failed to render stack layout ${layoutPath}: ${error.message}`
        )

        return content
    }
}

/**
 * Reads `stack_group`. Anything but a non-empty string is ignored with a
 * warning, and the stack is then treated as an ordinary, ungrouped one — a
 * group name is a key users reference from their layouts, so `String()`ing a
 * list or a date into one would mint public API nobody asked for.
 */
function getStackGroup(meta) {
    const group = meta.stack_group

    if (group == null || group === '') {
        return undefined
    }

    if (typeof group === 'string') {
        return group
    }

    console.warn(
        `[Stacks Plugin] Ignoring a non-string \`stack_group\` on stack "${meta.slug || meta.title || meta.href}" — use a plain string.`
    )

    return undefined
}

/**
 * Reads `stack_order`. Only finite numbers count; anything else is warned
 * about (when set) and sorts like a missing order.
 */
function getStackOrder(meta) {
    const order = meta.stack_order

    if (order == null) {
        return undefined
    }

    if (typeof order === 'number' && Number.isFinite(order)) {
        return order
    }

    console.warn(
        `[Stacks Plugin] Ignoring a non-numeric \`stack_order\` on stack "${meta.slug || meta.title || meta.href}".`
    )

    return undefined
}

/**
 * Stacks with a `stack_order` first, ascending; the rest after them. Array
 * sort is stable, so ties and unordered stacks keep build order.
 */
function byStackOrder(a, b) {
    const orderA = a.order ?? Infinity
    const orderB = b.order ?? Infinity

    if (orderA === orderB) {
        return 0
    }

    return orderA < orderB ? -1 : 1
}

function loadStacks(pagesData, defaultLang) {
    const stacks = {}
    const grouped = {}

    pagesData
        .filter(({ meta }) => meta?.type === 'stack')
        .forEach(({ content, meta }) => {
            const stack = {
                content: renderStack({ content, meta }),
                meta,
            }
            const group = getStackGroup(meta)

            if (group) {
                grouped[group] = grouped[group] || []
                grouped[group].push({ stack, order: getStackOrder(meta) })
            }

            // A grouped stack is addressed through its group, so it only
            // enters `app.stacks` when it asks to with an explicit slug. A
            // group usually holds the same section in several languages, and
            // deriving keys from those titles would collide and warn.
            const slug = group ? meta.slug : getStackSlug(meta)

            if (slug) {
                // Slugs are a single global namespace, so two stacks titled
                // "Introduction" in different directories collapse into one.
                // Last page in build order wins — keeping that behaviour, but
                // it used to happen in total silence, and the symptom (a stack
                // rendering the wrong content) points nowhere near the cause.
                if (Object.prototype.hasOwnProperty.call(stacks, slug)) {
                    console.warn(
                        `[Stacks Plugin] Duplicate stack slug "${slug}" — the later page overwrites the earlier one. Set an explicit \`slug\` to keep both.`
                    )
                }

                stacks[slug] = stack
            }
        })

    const stackGroups = {}
    const stackGroupsByLang = {}

    Object.entries(grouped).forEach(([group, entries]) => {
        const ordered = [...entries].sort(byStackOrder).map(({ stack }) => stack)

        stackGroups[group] = ordered
        stackGroupsByLang[group] = {}

        ordered.forEach((stack) => {
            // Same rule as plugin-tags: a page without `lang` belongs to the
            // site's default language.
            const lang = stack.meta.lang || defaultLang || 'default'

            stackGroupsByLang[group][lang] = stackGroupsByLang[group][lang] || []
            stackGroupsByLang[group][lang].push(stack)
        })
    })

    return { stacks, stackGroups, stackGroupsByLang }
}

/**
 * Returns modified app data with stacks.
 * @param {object} param - Object containing app and pagesData
 * @param {object} param.app - App data object
 * @param {object[]} param.pagesData - Array of page data objects
 * @returns {object} Modified app data with stacks and stack groups
 */
export function getAppData({ app, pagesData } = {}) {
    // Same guard as page-pagination:54 and page-navigation:41. Without it a
    // missing pagesData surfaced as `Cannot read properties of undefined`.
    const { stacks, stackGroups, stackGroupsByLang } = Array.isArray(pagesData)
        ? loadStacks(pagesData, app?.lang)
        : { stacks: {}, stackGroups: {}, stackGroupsByLang: {} }

    return {
        ...app,
        stacks,
        stackGroups,
        stackGroupsByLang,
    }
}
