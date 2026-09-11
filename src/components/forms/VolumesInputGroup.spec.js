// @vitest-environment happy-dom
import Buefy from 'buefy'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import VolumesInputGroup from './VolumesInputGroup.vue'
import i18n from '@/plugins/i18n'

vi.mock('@/assets/lang', () => ({ default: { en_us: {} } }))

function mountWith(items) {
	return mount(VolumesInputGroup, {
		props: { modelValue: items, label: 'Volumes', message: 'none', type: 'volume' },
		global: { plugins: [Buefy, i18n] },
	})
}

describe('volumesInputGroup', () => {
	// The host column browses the host. Offering it on a named volume is a trap: the
	// picker writes a path into `source`, which turns the volume into a bind on save
	// and detaches whatever was in it.
	it('does not offer a host picker for a named volume', () => {
		const wrapper = mountWith([
			{ type: 'volume', source: 'backend-storage', target: '/var/www/html/storage' },
		])

		expect(wrapper.text()).not.toContain('[object Object]')
		expect(wrapper.find('input').element.value).toBe('backend-storage')
		expect(wrapper.findComponent({ name: 'iconInput' }).exists()).toBe(false)
		wrapper.unmount()
	})

	it('still offers one for a bind, which is a path on the host', () => {
		const wrapper = mountWith([
			{ type: 'bind', source: './backend/docker/php.ini', target: '/usr/local/etc/php/conf.d/custom.ini' },
		])

		expect(wrapper.findComponent({ name: 'iconInput' }).exists()).toBe(true)
		wrapper.unmount()
	})

	it('decides per row, not per table', () => {
		// the reported app has one of each, in this order
		const wrapper = mountWith([
			{ type: 'volume', source: 'backend-storage', target: '/var/www/html/storage' },
			{ type: 'bind', source: './backend/docker/php.ini', target: '/usr/local/etc/php/conf.d/custom.ini' },
		])

		expect(wrapper.findAllComponents({ name: 'iconInput' })).toHaveLength(1)
		wrapper.unmount()
	})
})
