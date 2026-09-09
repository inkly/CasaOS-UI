// @vitest-environment happy-dom
import Buefy from 'buefy'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AppTerminalPanel from './AppTerminalPanel.vue'
import i18n from '@/plugins/i18n'

// require.context has no Vite equivalent; an empty table makes $t return its key.
vi.mock('@/assets/lang', () => ({ default: { en_us: {} } }))
vi.mock('file-saver', () => ({ default: { saveAs: vi.fn() } }))

const FileSaver = (await import('file-saver')).default

// The two cards open a websocket and a fullscreen teleport; neither is under test here.
const CardStub = { template: '<div/>', props: ['data', 'initWsUrl'], methods: { active() {} } }

function setup() {
	const composeAppLogs = vi.fn().mockResolvedValue({ status: 200, data: { data: 'line one\nline two' } })
	const wrapper = mount(AppTerminalPanel, {
		props: { appid: 'c1', appName: 'jellyfin', initialTab: 'logs' },
		global: {
			plugins: [Buefy, i18n],
			stubs: { 'terminal-card': CardStub, 'logs-card': CardStub },
			mocks: {
				$openAPI: { appManagement: { compose: { composeAppLogs } } },
				$store: { state: { access_token: 't', device: 'desktop' } },
				$wsProtocol: 'ws:',
				$baseURL: 'localhost',
			},
		},
	})
	return { wrapper, composeAppLogs }
}

describe('appTerminalPanel logs', () => {
	beforeEach(() => vi.useFakeTimers())
	afterEach(() => vi.useRealTimers())

	it('asks for the chosen number of lines, and keeps polling for a bounded log', async () => {
		const { wrapper, composeAppLogs } = setup()
		await flushPromises()
		expect(composeAppLogs).toHaveBeenLastCalledWith('jellyfin', 1000)

		await wrapper.find('select').setValue('100')
		await flushPromises()
		expect(composeAppLogs).toHaveBeenLastCalledWith('jellyfin', 100)

		const calls = composeAppLogs.mock.calls.length
		vi.advanceTimersByTime(5000)
		expect(composeAppLogs.mock.calls.length).toBe(calls + 1)
		wrapper.unmount()
	})

	it('stops polling on the whole log, and says so, instead of re-fetching it every five seconds', async () => {
		const { wrapper, composeAppLogs } = setup()
		await flushPromises()

		await wrapper.find('select').setValue('-1')
		await flushPromises()
		expect(composeAppLogs).toHaveBeenLastCalledWith('jellyfin', -1)
		expect(wrapper.text()).toContain('The whole log does not refresh on its own.')

		const calls = composeAppLogs.mock.calls.length
		vi.advanceTimersByTime(30000)
		expect(composeAppLogs.mock.calls.length).toBe(calls)

		// and going back to a bounded log starts it again
		await wrapper.find('select').setValue('1000')
		await flushPromises()
		vi.advanceTimersByTime(5000)
		expect(composeAppLogs.mock.calls.length).toBeGreaterThan(calls + 1)
		wrapper.unmount()
	})

	it('downloads what is on screen as a text file named after the service', async () => {
		const { wrapper } = setup()
		await flushPromises()

		await wrapper.findAll('button').find(b => b.text().includes('Download')).trigger('click')
		expect(FileSaver.saveAs).toHaveBeenCalledWith(expect.any(Blob), 'jellyfin-logs.txt')
		expect(await FileSaver.saveAs.mock.calls[0][0].text()).toBe('line one\nline two')
		wrapper.unmount()
	})
})
