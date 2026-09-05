// @vitest-environment happy-dom
import { getCurrentInstance, h, onBeforeUnmount, onMounted } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import socketPlugin from './socket'

// Stands in for the socket.io-client v2 socket: the plugin only ever calls
// `on` and `off` on it. `receive` is this test saying "the server pushed one".
function fakeSocket() {
	const listeners = new Map()
	return {
		count: event => (listeners.get(event) || []).length,
		on(event, fn) {
			if (!listeners.has(event)) listeners.set(event, [])
			listeners.get(event).push(fn)
		},
		off(event, fn) {
			listeners.set(event, (listeners.get(event) || []).filter(f => f !== fn))
		},
		receive(event, ...args) {
			for (const fn of [...(listeners.get(event) || [])]) fn(...args)
		}
	}
}

// test-utils 2 has no createLocalVue: every mount builds its own app, so the
// plugin is installed per mount instead.
function withSocket(socket) {
	return { global: { plugins: [[socketPlugin, socket]] } }
}

const blank = { render: () => h('div') }

function mountWith(socket, options) {
	return mount({ ...blank, ...options }, withSocket(socket))
}

describe('socket plugin', () => {
	it('binds each `sockets` handler, with the component as `this`', () => {
		const socket = fakeSocket()
		const seen = []
		const wrapper = mountWith(socket, {
			data: () => ({ widget: 'cpu' }),
			sockets: {
				'casaos:system:utilization'(res) {
					seen.push([this.widget, res])
				}
			}
		})

		socket.receive('casaos:system:utilization', { Properties: { sys_cpu: '[]' } })

		expect(seen).toEqual([['cpu', { Properties: { sys_cpu: '[]' } }]])
		wrapper.unmount()
	})

	it('delivers before destroy and not after', () => {
		const socket = fakeSocket()
		const handler = vi.fn()
		const wrapper = mountWith(socket, { sockets: { 'app:install-end': handler } })

		socket.receive('app:install-end')
		wrapper.unmount()
		socket.receive('app:install-end')

		expect(handler).toHaveBeenCalledTimes(1)
		expect(socket.count('app:install-end')).toBe(0)
	})

	it('unbinds only the destroyed component', () => {
		const socket = fakeSocket()
		const kept = vi.fn()
		const dropped = vi.fn()
		const first = mount({ ...blank, sockets: { 'app:install-end': dropped } }, withSocket(socket))
		const second = mount({ ...blank, sockets: { 'app:install-end': kept } }, withSocket(socket))

		first.unmount()
		socket.receive('app:install-end')

		expect(dropped).not.toHaveBeenCalled()
		expect(kept).toHaveBeenCalledTimes(1)
		second.unmount()
	})

	// AppStoreSourceManagement.vue reads $subscribe from setup(), which Vue 2.7
	// runs before any created hook — hence the plugin binding $socket earlier.
	it('exposes $socket.$subscribe before `created` runs', () => {
		const socket = fakeSocket()
		let earlyType = 'missing'
		const wrapper = mountWith(socket, {
			beforeCreate() {
				earlyType = typeof this.$socket.$subscribe
			}
		})

		expect(earlyType).toBe('function')
		wrapper.unmount()
	})

	it('$unsubscribe drops that event and leaves the others', () => {
		const socket = fakeSocket()
		const subscribed = vi.fn()
		const declared = vi.fn()
		const wrapper = mountWith(socket, {
			sockets: { 'app-store:register-error': declared },
			mounted() {
				this.$socket.$subscribe('app-store:register-end', subscribed)
			}
		})

		socket.receive('app-store:register-end')
		wrapper.vm.$socket.$unsubscribe('app-store:register-end')
		socket.receive('app-store:register-end')
		socket.receive('app-store:register-error')

		expect(subscribed).toHaveBeenCalledTimes(1)
		expect(declared).toHaveBeenCalledTimes(1)
		wrapper.unmount()
	})

	it('cleans up $subscribe handlers on destroy as well', () => {
		const socket = fakeSocket()
		const handler = vi.fn()
		const wrapper = mountWith(socket, {
			mounted() {
				this.$socket.$subscribe('app-store:register-end', handler)
			}
		})

		wrapper.unmount()
		socket.receive('app-store:register-end')

		expect(handler).not.toHaveBeenCalled()
		expect(socket.count('app-store:register-end')).toBe(0)
	})

	// The shape of AppStoreSourceManagement.vue's <script setup>: it reads both
	// functions during setup(), then uses them from the mount/unmount hooks.
	it('survives the AppStoreSourceManagement setup() pattern', () => {
		const socket = fakeSocket()
		const end = vi.fn()
		const wrapper = mountWith(socket, {
			setup() {
				const app = getCurrentInstance().proxy
				const subscribe = app.$socket.$subscribe
				const unsubscribe = app.$socket.$unsubscribe
				onMounted(() => subscribe('app-store:register-end', end))
				onBeforeUnmount(() => unsubscribe('app-store:register-end'))
				return {}
			}
		})

		socket.receive('app-store:register-end', { ok: 1 })
		wrapper.unmount()
		socket.receive('app-store:register-end')

		expect(end).toHaveBeenCalledTimes(1)
		expect(end).toHaveBeenCalledWith({ ok: 1 })
		expect(socket.count('app-store:register-end')).toBe(0)
	})
})
