// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse } from '@vue/compiler-sfc'

/**
 * Buefy 3.1.0 declares `emits` on every component and renamed every model prop
 * to `modelValue`. A leftover `@input` or `:value` on a `<b-*>` tag is therefore
 * not an error: it falls through as a native DOM listener / plain HTML
 * attribute, and the handler receives an `Event` instead of the value - or never
 * runs at all. Nothing throws and nothing warns, so the mount smoke tests cannot
 * see it. This is the only guard.
 */

const src = fileURLToPath(new URL('..', import.meta.url))

function collect(dir, out = {}) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name)
		if (entry.isDirectory())
			collect(path, out)
		else if (entry.name.endsWith('.vue'))
			out[path.slice(src.length)] = readFileSync(path, 'utf8')
	}
	return out
}

const sources = collect(src)

// Tags whose own `value` prop survives 3.1.0 and never was a v-model.
const valueIsItsOwnProp = new Set(['b-progress', 'b-tab-item', 'b-dropdown-item', 'b-slider-tick'])

const isDirective = (prop, name, arg) =>
	prop.type === 7 && prop.name === name && prop.arg?.content === arg

function inspect(node, file, found) {
	if (node.type === 1 && node.tag.startsWith('b-')) {
		for (const prop of node.props) {
			if (isDirective(prop, 'on', 'input')) {
				found.push(`${file}: <${node.tag} @input> - use @update:model-value`)
			}
			const bindsValue = isDirective(prop, 'bind', 'value') || (prop.type === 6 && prop.name === 'value')
			if (bindsValue && !valueIsItsOwnProp.has(node.tag)) {
				found.push(`${file}: <${node.tag} :value> - use :model-value`)
			}
		}
	}
	for (const child of node.children ?? []) inspect(child, file, found)
}

describe('buefy 3 bindings', () => {
	it('leaves no @input or :value on a Buefy component', () => {
		const found = []
		for (const [file, source] of Object.entries(sources)) {
			const { descriptor } = parse(source, { filename: file })
			if (descriptor.template?.ast)
				inspect(descriptor.template.ast, file, found)
		}
		expect(found).toEqual([])
	})

	it('leaves no `parent: this` in a $buefy.modal.open call', () => {
		const found = Object.entries(sources)
			.filter(([, source]) => source.includes('parent: this'))
			.map(([file]) => file)
		expect(found).toEqual([])
	})
})
