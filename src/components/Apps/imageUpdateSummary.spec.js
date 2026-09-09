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

	it('reports what could not be checked in its own louder message', () => {
		const toasts = imageUpdateSummary({ updatable: [], unchecked: { plex: 'not pulled on this host' } })
		expect(toasts).toHaveLength(2)
		expect(toasts[1]).toEqual({
			message: 'Apps that could not be checked: {count}. They keep their previous state.',
			params: { count: 1 },
			type: 'is-warning',
		})
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
