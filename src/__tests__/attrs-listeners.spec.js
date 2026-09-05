// @vitest-environment happy-dom
import Buefy from 'buefy'
import { config, mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it } from 'vitest'
import NewFileModal from '@/components/filebrowser/modals/NewFileModal.vue'

/**
 * The one non-shallow mount in the suite, and the only guard on listener
 * fallthrough. @vue/compat's INSTANCE_LISTENERS strips every on* key out of
 * $attrs (shouldSkipAttr), so a listener a child does not declare in `emits`
 * never reaches the DOM. Removing the `.native` modifiers left the app relying
 * on exactly that fallthrough. Buefy 3.1 ships
 * `compatConfig: {INSTANCE_LISTENERS: false}` on the 18 components that forward
 * attrs themselves, which is why <b-input> kept working - <b-icon> is not one of
 * them, so this modal's close button was dead until the flag came off globally.
 * shallowMount stubs both children and cannot see any of it.
 */

beforeAll(() => {
	config.global.plugins = [Buefy]
	config.global.mocks = {
		$t: key => key,
		$protocol: 'http:',
		$baseURL: '127.0.0.1',
		$api: { file: { create: () => new Promise(() => {}) } },
	}
})

const open = () => mount(NewFileModal, { props: { currentPath: '/' }, attachTo: document.body })

describe('listener fallthrough onto Buefy children', () => {
	it('emits close when the header icon is clicked', async () => {
		const wrapper = open()
		await wrapper.find('.close-button').trigger('click')
		expect(wrapper.emitted('close')).toHaveLength(1)
		wrapper.unmount()
	})

	it('carries typing back to the model', async () => {
		const wrapper = open()
		const input = wrapper.find('input')
		input.element.value = 'notes.txt'
		await input.trigger('input')
		expect(wrapper.vm.fileName).toBe('notes.txt')
		wrapper.unmount()
	})

	it('submits on Enter', async () => {
		const wrapper = open()
		let created = null
		wrapper.vm.$api.file.create = (target) => {
			created = target
			return new Promise(() => {})
		}
		await wrapper.find('input').trigger('keyup', { key: 'Enter' })
		// path.join picks the host separator, so match the leaf, not the whole path.
		expect(created).toMatch(/[\\/]New File$/)
		wrapper.unmount()
	})
})
