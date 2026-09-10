// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import UpdateModal from '@/components/settings/UpdateModal.vue'

// The dialog is opened programmatically, outside the router view, so closing it
// unmounts the component. Its upgrade-log poll used to go on running: the update
// rotates the token keys, that poll 401s, the interceptor sends the browser to
// /login, the owner signs in -- and the orphaned poll then reads its success line
// with the NEW token and calls reloadWhenBackendIsBack, which deletes the session it
// never knew about. That was the second login.
describe('the update dialog leaves nothing running', () => {
	beforeEach(() => {
		vi.useFakeTimers()
		localStorage.clear()
	})
	afterEach(() => vi.useRealTimers())

	function open() {
		const getContent = vi.fn(() => Promise.resolve({ data: { data: 'installing...' } }))
		const wrapper = mount(UpdateModal, {
			global: {
				mocks: {
					$t: k => k,
					$api: { file: { getContent }, sys: { updateCasaOS: vi.fn(() => Promise.resolve({})) } },
					$buefy: { toast: { open: vi.fn() } },
				},
				stubs: { 'b-button': true, 'b-loading': true },
			},
		})
		return { wrapper, getContent }
	}

	it('stops polling the upgrade log when it is closed', async () => {
		const { wrapper, getContent } = open()

		wrapper.vm.getUpdateLogs()
		vi.advanceTimersByTime(600)
		expect(getContent.mock.calls.length).toBeGreaterThan(0)

		const before = getContent.mock.calls.length
		wrapper.unmount()
		vi.advanceTimersByTime(5000)

		expect(getContent.mock.calls.length).toBe(before)
	})

	it('keeps no session-clearing timer alive either', () => {
		const { wrapper } = open()

		const cleared = []
		const realClear = globalThis.clearInterval
		globalThis.clearInterval = (id) => {
			cleared.push(id)
			return realClear(id)
		}

		wrapper.vm.getUpdateLogs()
		wrapper.vm.checkUpdateState()
		const running = [wrapper.vm.updateTimer, wrapper.vm.timer]
		wrapper.unmount()
		globalThis.clearInterval = realClear

		for (const id of running)
			expect(cleared).toContain(id)
	})
})
