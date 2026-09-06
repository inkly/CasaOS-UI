// @vitest-environment happy-dom
import Buefy from 'buefy'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import i18n from '@/plugins/i18n'
import '@/plugins/vee-validate'
import Login from '@/views/Login.vue'

// require.context has no Vite equivalent; an empty table makes $t return its key.
vi.mock('@/assets/lang', () => ({ default: { en_us: {} } }))

/**
 * A real mount with the real $t. The smoke test in __tests__/mount.spec.js
 * stubs <VeeField> and mocks $t as identity, so it kept passing while the
 * served bundle rendered the Username field alone: `$t(errors)` handed an
 * array to vue-i18n 9, which throws where vue-i18n 8 translated it, and Vue
 * replaced the throwing Field with a comment node.
 */
describe('login', () => {
	it('renders the username and password inputs', () => {
		const wrapper = mount(Login, { global: { plugins: [Buefy, i18n] } })
		expect(wrapper.findAll('input')).toHaveLength(2)
		wrapper.unmount()
	})
})
