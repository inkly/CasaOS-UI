import { describe, expect, it, vi } from 'vitest'
import createEventBus from './eventBus'

describe('createEventBus', () => {
	it('delivers the single payload, or undefined when there is none', () => {
		const bus = createEventBus()
		const seen = []
		bus.$on('goto', e => seen.push(e))
		bus.$emit('goto', { path: '/media' })
		bus.$emit('goto')

		expect(seen).toEqual([{ path: '/media' }, undefined])
	})

	it('calls every subscriber of an event', () => {
		const bus = createEventBus()
		const a = vi.fn()
		const b = vi.fn()
		bus.$on('reload-app-list', a)
		bus.$on('reload-app-list', b)
		bus.$emit('reload-app-list')

		expect(a).toHaveBeenCalledTimes(1)
		expect(b).toHaveBeenCalledTimes(1)
	})

	it('$off with a handler removes only that handler', () => {
		const bus = createEventBus()
		const kept = vi.fn()
		const dropped = vi.fn()
		bus.$on('peer-left', kept)
		bus.$on('peer-left', dropped)
		bus.$off('peer-left', dropped)
		bus.$emit('peer-left', 'peer-id')

		expect(kept).toHaveBeenCalledWith('peer-id')
		expect(dropped).not.toHaveBeenCalled()
	})

	it('$off without a handler clears the event, as Vue did', () => {
		const bus = createEventBus()
		const handler = vi.fn()
		bus.$on('signal', handler)
		bus.$off('signal')
		bus.$emit('signal', 'x')

		expect(handler).not.toHaveBeenCalled()
	})

	it('ignores $off for an unknown event or an unregistered handler', () => {
		const bus = createEventBus()
		const handler = vi.fn()
		bus.$on('peers', handler)
		bus.$off('peers', vi.fn())
		bus.$off('never-registered')
		bus.$emit('peers', [])

		expect(handler).toHaveBeenCalledTimes(1)
	})
})
