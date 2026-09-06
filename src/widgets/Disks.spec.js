// @vitest-environment happy-dom
import Buefy from 'buefy'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import i18n from '@/plugins/i18n'
import Disks from '@/widgets/Disks.vue'
import DriveItem from '@/components/Storage/DriveItem.vue'

// require.context has no Vite equivalent; an empty table makes $t return its key.
vi.mock('@/assets/lang', () => ({ default: { en_us: {} } }))
// The widget imports the Storage manager for its settings button, and lottie-web
// paints into a canvas on import - happy-dom has no 2d context.
vi.mock('lottie-web-vue', () => ({ default: { name: 'lottie-animation', template: '<div/>' } }))

/**
 * On a virtual disk smartctl answers without a `smart_status` object, and
 * LocalStorage used to read the zero value as "failed": the home widget showed
 * Damage while the Storage manager called the same disk healthy. LocalStorage
 * now sends `smart_status` ("passed" / "failed" / "unavailable"); an older
 * LocalStorage only sends the `health` Boolean, which still decides.
 */
const cases = [
	['a passed disk', { health: true, smart_status: 'passed' }, 'Healthy'],
	['a failed disk', { health: false, smart_status: 'failed' }, 'Damage'],
	['a disk without SMART data', { health: true, smart_status: 'unavailable' }, 'No SMART data'],
	['an older LocalStorage without smart_status', { health: true }, 'Healthy'],
	['an older LocalStorage reporting a failure', { health: false }, 'Damage'],
]

function mountWidget(sys_disk) {
	const $store = { state: { hardwareInfo: { sys_disk: { size: 100, used: 40, ...sys_disk }, sys_usb: [] } } }
	return mount(Disks, { global: { plugins: [Buefy, i18n], mocks: { $store } } })
}

describe('storage widget', () => {
	// mounted() reads the store after the first render: the tag settles a tick later.
	it.each(cases)('tags %s', async (_label, sys_disk, tag) => {
		const wrapper = mountWidget(sys_disk)
		await wrapper.vm.$nextTick()
		expect(wrapper.find('.tag').text()).toBe(tag)
		wrapper.unmount()
	})

	it('follows the next utilization sample', async () => {
		const wrapper = mountWidget({ health: true, smart_status: 'passed' })
		const onUtilization = wrapper.vm.$options.sockets['casaos:system:utilization']
		onUtilization.call(wrapper.vm, { Properties: {
			sys_disk: JSON.stringify({ size: 100, used: 40, health: true, smart_status: 'unavailable' }),
			sys_usb: '[]',
		} })
		await wrapper.vm.$nextTick()
		expect(wrapper.find('.tag').text()).toBe('No SMART data')
		wrapper.unmount()
	})
})

describe('drive item', () => {
	const rows = [
		['a passed disk', { health: true, smart_status: 'passed' }, 'Healthy'],
		['a failed disk', { health: false, smart_status: 'failed' }, 'Damage'],
		['a disk without SMART data', { health: true, smart_status: 'unavailable' }, 'N/A'],
		['an older LocalStorage without smart_status', { health: true }, 'Healthy'],
	]

	it.each(rows)('reads the health of %s', (_label, disk, text) => {
		const item = { name: 'sda', model: 'QEMU HARDDISK', size: 100, disk_type: 'HDD', temperature: 0, ...disk }
		const wrapper = mount(DriveItem, { props: { item }, global: { plugins: [Buefy, i18n] } })
		expect(wrapper.find('p b').text()).toBe(text)
		wrapper.unmount()
	})
})
