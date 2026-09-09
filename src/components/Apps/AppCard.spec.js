// @vitest-environment happy-dom
import Buefy from 'buefy'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/plugins/i18n'
import AppCard from '@/components/Apps/AppCard.vue'
import cTooltip from '@/components/basicComponents/tooltip/tooltip.vue'

// require.context has no Vite equivalent; an empty table makes $t return its key.
vi.mock('@/assets/lang', () => ({ default: { en_us: {} } }))

async function card(item, mocks = {}) {
	// mount, not shallowMount: the badge sits in a Buefy tooltip's default slot,
	// and a stub does not render its slots
	const wrapper = mount(AppCard, {
		props: { item: { name: 'syncthing', app_type: 'v2app', status: 'running', title: { en_us: 'Syncthing' }, ...item } },
		global: {
			plugins: [Buefy, i18n],
			provide: { homeShowFiles: () => {}, openAppStore: () => {} },
			mocks: { $baseIp: 'localhost', ...mocks },
		},
		// the card's menu is rendered with append-to-body, so it lands outside
		// the wrapper and has to be looked for in the document
		attachTo: document.body,
	})
	// the NEW marker is read from sessionStorage in mounted(), one tick after
	// the first render
	await nextTick()

	return wrapper
}

// A failed assertion skips the unmount that follows it, and the button tests below
// look at the whole document, so one broken card left behind would make them pass
// on someone else's markup.
afterEach(() => {
	document.body.innerHTML = ''
})

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

describe('app card update button', () => {
	function offersUpdate() {
		return [...document.body.querySelectorAll('button')]
			.some(b => b.textContent.includes('Check then update'))
	}

	it('offers the update to an app installed from a store', async () => {
		const wrapper = await card({ is_uncontrolled: false })
		expect(offersUpdate()).toBe(true)
		wrapper.unmount()
	})

	it('offers it to an imported app too', async () => {
		// for those the update is a pull of the tags they already name, which is the
		// only kind of update they can have; before this they had no update path at all
		const wrapper = await card({ is_uncontrolled: true })
		expect(offersUpdate()).toBe(true)
		wrapper.unmount()
	})
})

describe('imported container', () => {
	// an adopted container is keyed by its Docker ID, and carries its Docker name
	// as the only title the grid has for it
	const imported = { name: 'ab12cd34ef56', app_type: 'container', title: { en_us: 'plex' } }

	function labels() {
		return [...document.body.querySelectorAll('button')].map(b => b.textContent.trim())
	}

	function offersRecreate() {
		return labels().some(l => l.includes('Pull image and recreate'))
	}

	async function recreateSpy(item) {
		const recreateContainerByID = vi.fn(() => Promise.resolve({}))
		const wrapper = await card(item, {
			$openAPI: { appManagement: { container: { recreateContainerByID } } },
		})
		return { wrapper, recreateContainerByID }
	}

	it('offers to pull and recreate a container CasaOS did not install', async () => {
		const wrapper = await card(imported)
		expect(offersRecreate()).toBe(true)
		wrapper.unmount()
	})

	it('offers it to no other kind of app', async () => {
		// the endpoint takes a raw container ID and is not compose-aware: run on a
		// container of a compose app it would leave the project's own state behind
		for (const app_type of ['v2app', 'v1app', 'LinkApp']) {
			const wrapper = await card({ app_type })
			expect(offersRecreate(), app_type).toBe(false)
			wrapper.unmount()
		}
	})

	it('offers an imported container nothing it cannot do', async () => {
		// Open, Uninstall and the start/stop pair all route through code that only
		// handles v1 and v2 apps
		const wrapper = await card(imported)
		expect(labels()).toEqual(['Pull image and recreate'])
		wrapper.unmount()
	})

	it('says what a recreate destroys before doing it', async () => {
		const { wrapper, recreateContainerByID } = await recreateSpy(imported)

		document.body.querySelectorAll('button').forEach((b) => {
			if (b.textContent.includes('Pull image and recreate'))
				b.click()
		})
		await nextTick()

		const dialog = document.body.textContent
		expect(dialog).toContain('plex')
		expect(dialog).toContain('Volumes and their data are kept')
		expect(recreateContainerByID).not.toHaveBeenCalled()

		document.body.querySelectorAll('button').forEach((b) => {
			if (b.textContent.trim() === 'Recreate container')
				b.click()
		})
		await nextTick()

		// pull on, force off: without a newer image there is nothing to gain from
		// destroying a container whose definition exists nowhere else
		expect(recreateContainerByID).toHaveBeenCalledWith('ab12cd34ef56', true)
		expect(wrapper.vm.isRecreating).toBe(true)
		wrapper.unmount()
	})

	it('follows the recreate by the name the events carry, not the card key', async () => {
		const wrapper = await card(imported, { $EventBus: { $emit: () => {} } })
		const updateEnd = wrapper.vm.$options.sockets['app:update-end']
		wrapper.vm.isRecreating = true

		// the container ID keys the card, but the event names the container
		updateEnd.call(wrapper.vm, { Properties: { 'app:name': 'ab12cd34ef56' } })
		expect(wrapper.vm.isRecreating).toBe(true)

		updateEnd.call(wrapper.vm, { Properties: { 'app:name': 'plex' } })
		expect(wrapper.vm.isRecreating).toBe(false)
		// the recreate leaves a new container with a new ID behind, so the grid the
		// card came from has to be read again
		expect(wrapper.emitted('updateState')).toHaveLength(1)
		wrapper.unmount()
	})

	it('stops waiting when the recreate reports an error', async () => {
		const wrapper = await card(imported)
		wrapper.vm.isRecreating = true

		wrapper.vm.$options.sockets['app:update-error'].call(wrapper.vm, {
			Properties: { 'app:name': 'plex', 'message': 'no space left on device' },
		})
		expect(wrapper.vm.isRecreating).toBe(false)
		wrapper.unmount()
	})
})
