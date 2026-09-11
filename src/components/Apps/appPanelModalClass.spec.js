// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// A modal's width lives in a stylesheet keyed on the class the CALLER passes, so
// the two halves are in different files and nothing links them. Three panels have
// now shipped at Buefy's default 640px because of that: two with `account-modal`,
// a class that has no rule anywhere in the tree, and the app settings panel with
// an empty string -- which meant every rule written for it, including one widening
// it for the Containers tab, applied to nothing.
//
// Reading the source is the only place this can be checked: a mounted test sees
// the class go in, and no unit test computes a width.

function read(name) {
	return readFileSync(fileURLToPath(new URL(name, import.meta.url)), 'utf8')
}

describe('the class the app panel is opened with', () => {
	const section = read('./AppSection.vue')
	const panel = read('./AppPanel.vue')

	// `component: AppPanel` ... `customClass: '<x>'`, per modal.open call
	const opened = [...section.matchAll(/component:\s*AppPanel,[\s\S]{0,400}?customClass:\s*'([^']*)'/g)]
		.map(match => match[1])

	it('is passed at every call site', () => {
		expect(opened.length).toBeGreaterThan(0)
		expect(opened).not.toContain('')
	})

	it('is a class the panel actually styles', () => {
		for (const name of new Set(opened))
			expect(panel).toContain(`.${name} {`)
	})
})
