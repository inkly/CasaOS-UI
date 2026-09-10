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
		const toasts = imageUpdateSummary({ updatable: [], unchecked: { plex: 'plex/inc:latest: not pulled on this host' } })
		expect(toasts).toHaveLength(2)
		expect(toasts[1]).toEqual({
			message: 'Could not check {detail}. They keep their previous state.',
			params: { detail: 'plex (not pulled on this host)' },
			type: 'is-warning',
			duration: 15000,
		})
	})

	it('says one shared reason once, and leads with the apps', () => {
		// what a real box answered: four apps behind one unreachable registry, each
		// carrying a digest-pinned image reference. Repeating the cause four times with
		// 64 characters of hex apiece buried the only part anyone can act on.
		const unreachable = 'its registry could not be reached'
		const toasts = imageUpdateSummary({
			updatable: [],
			unchecked: {
				'big-bear-dockhand': `fnsys/dockhand:latest: ${unreachable}`,
				'big-bear-dozzle': `amir20/dozzle:v10.7.1: ${unreachable}`,
				'big-bear-wud': `fmartinou/whats-up-docker:6.6.1: ${unreachable}`,
				'big-bear-portainer': `portainer/portainer-ce:2.21.0: ${unreachable}`,
			},
		})

		expect(toasts[1].params.detail).toBe(
			`big-bear-dockhand, big-bear-dozzle, big-bear-portainer +1 (${unreachable})`,
		)
		// the cause appears once, not once per app
		expect(toasts[1].params.detail.split(unreachable)).toHaveLength(2)
	})

	it('keeps distinct reasons apart', () => {
		const toasts = imageUpdateSummary({
			updatable: [],
			unchecked: {
				plex: 'plex/inc:latest: not pulled on this host',
				gluetun: 'qmcgaw/gluetun:latest: its registry could not be reached',
				qbit: 'lscr.io/qbittorrent:latest: its registry could not be reached',
			},
		})

		const groups = toasts[1].params.detail.split(' · ')
		expect(groups).toHaveLength(2)
		expect(groups).toContain('gluetun, qbit (its registry could not be reached)')
		expect(groups).toContain('plex (not pulled on this host)')
	})

	it('shows a reason it cannot split whole rather than guessing', () => {
		const toasts = imageUpdateSummary({ updatable: [], unchecked: { odd: 'something went wrong' } })
		expect(toasts[1].params.detail).toBe('odd (something went wrong)')
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
