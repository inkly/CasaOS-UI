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

it('reloads the page once the upgrade log reports success, so the installed UI replaces the running bundle', async () => {
	vi.useFakeTimers()
	const replace = vi.fn(() => Promise.resolve())
	const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {})
	const getContent = vi.fn().mockResolvedValue({ data: { data: '[  OK  ] CasaOS upgrade successfully' } })
	const wrapper = shallowMount(UpdateModal, {
		props: { changeLog: '' },
		global: { mocks: { $t: key => key, $router: { replace }, $api: { sys: { updateCasaOS: () => Promise.resolve() }, file: { getContent } } } },
	})
	try {
		await wrapper.vm.updateSystem()
		await vi.advanceTimersByTimeAsync(200)
		expect(localStorage.getItem('is_update')).toBe('true')
		await vi.advanceTimersByTimeAsync(1000)
		expect(replace).toHaveBeenCalledWith({ path: '/logout' })
		expect(reload).toHaveBeenCalledTimes(1)
	} finally {
		vi.useRealTimers()
		reload.mockRestore()
		localStorage.removeItem('is_update')
	}
})
