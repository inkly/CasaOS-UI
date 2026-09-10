import { describe, expect, it } from 'vitest'
import { imageUpdateSummary } from '@/components/Apps/imageUpdateSummary'

describe('image update summary', () => {
	it('reads as English and as French for one app, not just for many', () => {
		// "1 apps have a newer image" is the single most likely outcome of a check on
		// a home server, so the wording carries the count instead of agreeing with it
		expect(imageUpdateSummary({ updatable: ['syncthing'], unchecked: {} })).toEqual([
			{ message: 'Apps with a newer image: {count}', params: { count: 1 }, type: 'is-success' },
		])
	})

	it('counts them all when there are several', () => {
		expect(imageUpdateSummary({ updatable: ['a', 'b', 'c'], unchecked: {} })).toEqual([
			{ message: 'Apps with a newer image: {count}', params: { count: 3 }, type: 'is-success' },
		])
	})

	it('says so plainly when nothing has moved', () => {
		expect(imageUpdateSummary({ updatable: [], unchecked: {} })).toEqual([
			{ message: 'Every app is running the newest image.', params: undefined, type: 'is-success' },
		])
	})

	it('names what could not be checked, and why, in its own louder message', () => {
		// a count alone is something to worry about and nothing to do
		const toasts = imageUpdateSummary({ updatable: [], unchecked: { plex: 'not pulled on this host' } })
		expect(toasts).toHaveLength(2)
		expect(toasts[1]).toEqual({
			message: 'Could not check {detail}. They keep their previous state.',
			params: { detail: 'plex: not pulled on this host', rest: 0 },
			type: 'is-warning',
			duration: 15000,
		})
	})

	it('gives each app its own reason', () => {
		const toasts = imageUpdateSummary({
			updatable: [],
			unchecked: { plex: 'not pulled on this host', gluetun: 'registry did not answer' },
		})
		// sorted, so the same check twice reads the same way
		expect(toasts[1].params.detail).toBe('gluetun: registry did not answer / plex: not pulled on this host')
	})

	it('stops naming after three, so one dead registry does not fill the screen', () => {
		const unchecked = {}
		for (const name of ['a', 'b', 'c', 'd', 'e'])
			unchecked[name] = 'registry did not answer'

		const toasts = imageUpdateSummary({ updatable: [], unchecked })
		expect(toasts[1].message).toBe('Could not check {detail}, and {rest} more. They keep their previous state.')
		expect(toasts[1].params.rest).toBe(2)
		expect(toasts[1].params.detail.split(' / ')).toHaveLength(3)
	})

	for (const [name, data] of [
		['no data at all', undefined],
		['a null body', null],
		['an empty object', {}],
		['updatable missing', { unchecked: {} }],
		['unchecked missing', { updatable: [] }],
		['updatable not a list', { updatable: 3, unchecked: {} }],
		['unchecked null', { updatable: [], unchecked: null }],
	]) {
		it(`does not call ${name} good news`, () => {
			// an answer the dashboard cannot make sense of is not an answer, and the
			// reassuring reading of it is the one that must not be shown
			const toasts = imageUpdateSummary(data)
			expect(toasts).toEqual([
				{ message: 'The check did not come back with an answer.', type: 'is-warning' },
			])
		})
	}
})
