import { describe, expect, it } from 'vitest'
import { ageKey, containerFacts, groupLegacyApps } from './legacyApps'

// One heading covered three populations, and it was a wrong instruction for two
// of them.
describe('telling them apart', () => {
	const items = [
		{ name: 'plex', app_type: 'v1app' },
		{ name: 'a1', app_type: 'container', compose_project: 'immich' },
		{ name: 'adoring_antonelli', app_type: 'container' },
		{ name: 'gifted_mendeleev', app_type: 'container', compose_project: '' },
	]

	it('puts an old CasaOS app in the group the old heading was right about', () => {
		expect(groupLegacyApps(items).rebuild.map(i => i.name)).toEqual(['plex'])
	})

	it('does not tell somebody to rebuild a stack that is already running', () => {
		// a Portainer or Dockge stack whose config file this host cannot read: it is
		// managed, just not from here
		expect(groupLegacyApps(items).managedElsewhere.map(i => i.name)).toEqual(['a1'])
	})

	it('calls a container somebody ran by hand what it is', () => {
		// not an app, and with nothing to rebuild
		expect(groupLegacyApps(items).loose.map(i => i.name)).toEqual(['adoring_antonelli', 'gifted_mendeleev'])
	})

	it('survives nothing at all', () => {
		expect(groupLegacyApps(null)).toEqual({ rebuild: [], managedElsewhere: [], loose: [] })
		expect(groupLegacyApps([])).toEqual({ rebuild: [], managedElsewhere: [], loose: [] })
	})
})

describe('what a card can say when the name says nothing', () => {
	const ago = () => '3mo'

	it('leads with the image, which is the one line that says what it is', () => {
		expect(containerFacts({ image: 'nginx:alpine', port: '8080', created: 1 }, ago))
			.toEqual(['nginx:alpine', ':8080', '3mo'])
	})

	it('omits what is not known rather than showing a gap', () => {
		expect(containerFacts({ image: 'alpine' }, ago)).toEqual(['alpine'])
		expect(containerFacts({}, ago)).toEqual([])
	})

	it('treats a created of zero as no date', () => {
		// zero is what the API sends when the daemon gave none
		expect(containerFacts({ image: 'alpine', created: 0 }, ago)).toEqual(['alpine'])
	})
})

describe('how long ago', () => {
	const now = Date.UTC(2026, 8, 11, 12, 0, 0)
	const daysAgo = n => Math.floor((now - n * 86400000) / 1000)

	it('is rough on purpose', () => {
		// nobody deciding whether to delete a stray container needs the minute
		expect(ageKey(daysAgo(0), now)).toBe('today')
		expect(ageKey(daysAgo(5), now)).toBe('5d')
		expect(ageKey(daysAgo(90), now)).toBe('3mo')
		expect(ageKey(daysAgo(800), now)).toBe('2y')
	})

	it('says nothing about a container created in the future', () => {
		// a clock that disagrees is not an age
		expect(ageKey(daysAgo(-5), now)).toBe('')
	})
})
