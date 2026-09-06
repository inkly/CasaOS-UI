// @vitest-environment happy-dom
import Buefy from 'buefy'
import VueDOMPurifyHTML from 'vue-dompurify-html'
import { config, shallowMount } from '@vue/test-utils'
import { beforeAll, expect, it, vi } from 'vitest'
import UpdateModal from '@/components/settings/UpdateModal.vue'

beforeAll(() => {
	config.global.plugins = [Buefy, VueDOMPurifyHTML]
})

it('shows the upgrade log as text, without the installer colour codes', async () => {
	const wrapper = shallowMount(UpdateModal, {
		props: { changeLog: '# hi' },
		global: { mocks: { $t: key => key, $api: {} } },
	})
	const esc = String.fromCharCode(27)
	await wrapper.setData({
		isUpdating: true,
		updateLogs: `${esc}[90m[${esc}[0m${esc}[38;5;154m INFO ${esc}[0m${esc}[90m]${esc}[0m Downloading...\n[  OK  ] Verified`,
	})
	expect(wrapper.find('pre').text()).toBe('[ INFO ] Downloading...\n[  OK  ] Verified')
})

it('clears the session and reloads once the backend answers again, without going through the router', async () => {
	vi.useFakeTimers()
	const replace = vi.fn(() => Promise.resolve())
	const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {})
	const getContent = vi.fn().mockResolvedValue({ data: { data: '[  OK  ] CasaOS upgrade successfully' } })
	// the services restart: the status route refuses twice, then answers
	const getUserStatus = vi.fn()
		.mockRejectedValueOnce(new Error('Network Error'))
		.mockRejectedValueOnce(new Error('Network Error'))
		.mockResolvedValue({ data: { success: 200, data: { initialized: true } } })
	localStorage.setItem('access_token', 'old')
	localStorage.setItem('refresh_token', 'old')
	localStorage.setItem('user', '{}')
	const wrapper = shallowMount(UpdateModal, {
		props: { changeLog: '' },
		global: { mocks: { $t: key => key, $router: { replace }, $api: { sys: { updateCasaOS: () => Promise.resolve() }, file: { getContent }, users: { getUserStatus } } } },
	})
	try {
		await wrapper.vm.updateSystem()
		await vi.advanceTimersByTimeAsync(200)
		expect(localStorage.getItem('is_update')).toBe('true')
		expect(localStorage.getItem('access_token')).toBeNull()
		expect(localStorage.getItem('refresh_token')).toBeNull()
		expect(localStorage.getItem('user')).toBeNull()
		await vi.advanceTimersByTimeAsync(1000)
		expect(getUserStatus).toHaveBeenCalledTimes(1)
		expect(reload).not.toHaveBeenCalled()
		await vi.advanceTimersByTimeAsync(1000)
		expect(getUserStatus).toHaveBeenCalledTimes(2)
		expect(reload).not.toHaveBeenCalled()
		await vi.advanceTimersByTimeAsync(1000)
		expect(getUserStatus).toHaveBeenCalledTimes(3)
		expect(reload).toHaveBeenCalledTimes(1)
		await vi.advanceTimersByTimeAsync(5000)
		expect(reload).toHaveBeenCalledTimes(1)
		expect(replace).not.toHaveBeenCalled()
	} finally {
		vi.useRealTimers()
		reload.mockRestore()
		localStorage.removeItem('is_update')
	}
})

it('moves on from a probe that never answers, and reloads only once for several success responses', async () => {
	vi.useFakeTimers()
	const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {})
	// the first probe hangs (a restarting service keeps the connection), the second answers
	const getUserStatus = vi.fn()
		.mockImplementationOnce(() => new Promise(() => {}))
		.mockResolvedValue({ data: { success: 200, data: { initialized: true } } })
	// the log answers in 700 ms, so four responses carrying the success line are in flight
	// when the first one lands (at 900 ms); the others land at 1100, 1300 and 1500 ms
	const getContent = vi.fn(() => new Promise(resolve => setTimeout(() => resolve({ data: { data: '[  OK  ] CasaOS upgrade successfully' } }), 700)))
	const wrapper = shallowMount(UpdateModal, {
		props: { changeLog: '' },
		global: { mocks: { $t: key => key, $api: { sys: { updateCasaOS: () => Promise.resolve() }, file: { getContent }, users: { getUserStatus } } } },
	})
	try {
		await wrapper.vm.updateSystem()
		await vi.advanceTimersByTimeAsync(1000)
		expect(wrapper.vm.reloading).toBe(true)
		expect(getContent).toHaveBeenCalledTimes(4)
		await vi.advanceTimersByTimeAsync(1000) // t = 2000: the first probe went out at 1900 and hangs
		expect(getUserStatus).toHaveBeenCalledTimes(1)
		await vi.advanceTimersByTimeAsync(3000) // t = 5000: the probe was abandoned at 4900
		expect(reload).not.toHaveBeenCalled()
		await vi.advanceTimersByTimeAsync(1000) // t = 6000: the second probe, at 5900, answered
		expect(getUserStatus).toHaveBeenCalledTimes(2)
		expect(reload).toHaveBeenCalledTimes(1)
		await vi.advanceTimersByTimeAsync(10000)
		expect(reload).toHaveBeenCalledTimes(1) // the three late success responses started no poller
	} finally {
		vi.useRealTimers()
		reload.mockRestore()
		localStorage.removeItem('is_update')
	}
})

it('reloads after two minutes even if the backend never answers', async () => {
	vi.useFakeTimers()
	const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {})
	const getUserStatus = vi.fn().mockRejectedValue(new Error('Network Error'))
	const wrapper = shallowMount(UpdateModal, {
		props: { changeLog: '' },
		global: { mocks: { $t: key => key, $api: { users: { getUserStatus } } } },
	})
	try {
		wrapper.vm.reloadWhenBackendIsBack()
		await vi.advanceTimersByTimeAsync(119000)
		expect(reload).not.toHaveBeenCalled()
		await vi.advanceTimersByTimeAsync(3000)
		expect(reload).toHaveBeenCalledTimes(1)
	} finally {
		vi.useRealTimers()
		reload.mockRestore()
	}
})
