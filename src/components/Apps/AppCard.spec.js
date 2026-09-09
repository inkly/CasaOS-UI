// @vitest-environment happy-dom
import Buefy from 'buefy'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import i18n from '@/plugins/i18n'
import AppCard from '@/components/Apps/AppCard.vue'
import cTooltip from '@/components/basicComponents/tooltip/tooltip.vue'

// require.context has no Vite equivalent; an empty table makes $t return its key.
vi.mock('@/assets/lang', () => ({ default: { en_us: {} } }))

async function card(item) {
	// mount, not shallowMount: the badge sits in a Buefy tooltip's default slot,
	// and a stub does not render its slots
	const wrapper = mount(AppCard, {
		props: { item: { name: 'syncthing', app_type: 'v2app', status: 'running', title: { en_us: 'Syncthing' }, ...item } },
		global: {
			plugins: [Buefy, i18n],
			provide: { homeShowFiles: () => {}, openAppStore: () => {} },
			mocks: { $baseIp: 'localhost' },
		},
	})
	// the NEW marker is read from sessionStorage in mounted(), one tick after
	// the first render
	await nextTick()

	return wrapper
}

function badges(wrapper) {
	return wrapper.findAllComponents(cTooltip).map(c => c.props('content'))
}

describe('app card update badge', () => {
	it('marks an app the last image check found something newer for', async () => {
		const wrapper = await card({ update_available: true })
		expect(badges(wrapper)).toEqual(['Update available'])
		wrapper.unmount()
	})

	it('says nothing about an app that has not been checked', async () => {
		// absent is not false: nobody has looked, and a badge either way would be a
		// claim this app cannot back up
		const wrapper = await card({})
		expect(badges(wrapper)).toEqual([])
		wrapper.unmount()
	})

	it('says nothing about an app that is up to date', async () => {
		const wrapper = await card({ update_available: false })
		expect(badges(wrapper)).toEqual([])
		wrapper.unmount()
	})

	it('does not stack the update badge on top of the NEW marker', async () => {
		// both are absolutely positioned over the icon, so only one may render
		sessionStorage.setItem('newAppTag', JSON.stringify(['syncthing']))
		const wrapper = await card({ update_available: true })
		expect(badges(wrapper)).toEqual(['NEW'])
		sessionStorage.removeItem('newAppTag')
		wrapper.unmount()
	})
})
