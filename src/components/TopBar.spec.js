import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// The settings menu is a Buefy dropdown whose slot a shallow mount never
// renders, and a full mount of TopBar needs more scaffolding than the row is
// worth (see __tests__/mount.spec.js), so the template is checked as text.
describe('top bar settings', () => {
	it('has no news feed row', () => {
		const source = readFileSync(new URL('./TopBar.vue', import.meta.url), 'utf8')
		expect(source).not.toMatch(/news feed|rss/i)
	})
})
