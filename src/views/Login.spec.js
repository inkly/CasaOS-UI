// @vitest-environment happy-dom
import Buefy from 'buefy'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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

const session = {
	token: { access_token: 'a', refresh_token: 'r', expires_at: 1 },
	user: { id: 1, username: 'root', totp_enabled: true },
}

function mountWithApi(login, verify2FA) {
	const $api = {
		users: { login, verify2FA },
		sys: { getVersion: () => Promise.resolve({ data: { success: 200, data: { current_version: '0.4.37' } } }) },
	}
	const $router = { push: vi.fn() }
	const wrapper = mount(Login, { global: { plugins: [Buefy, i18n], mocks: { $api, $router, $store: { commit: vi.fn() } } } })
	return { wrapper, $router }
}

async function submitPassword(wrapper) {
	const [username, password] = wrapper.findAll('input')
	await username.setValue('root')
	await password.setValue('secret')
	await wrapper.find('button.is-primary').trigger('click')
	await flushPromises()
}

describe('login with two-factor authentication', () => {
	const preAuth = () => Promise.resolve({ data: { success: 10014, data: { pre_auth_token: 't', expires_at: Date.now() / 1000 + 300 } } })

	beforeEach(() => localStorage.clear())

	it('switches to the code step without opening a session', async () => {
		const { wrapper, $router } = mountWithApi(preAuth)
		await submitPassword(wrapper)
		const inputs = wrapper.findAll('input')
		expect(inputs).toHaveLength(1)
		expect(inputs[0].attributes('inputmode')).toBe('numeric')
		expect(inputs[0].attributes('autocomplete')).toBe('one-time-code')
		expect(localStorage.getItem('access_token')).toBeNull()
		expect($router.push).not.toHaveBeenCalled()
		wrapper.unmount()
	})

	it('verifies the code and finishes the login', async () => {
		const verify2FA = vi.fn(() => Promise.resolve({ data: { success: 200, data: session } }))
		const { wrapper, $router } = mountWithApi(preAuth, verify2FA)
		await submitPassword(wrapper)
		await wrapper.find('input').setValue('123456')
		await wrapper.find('input').trigger('keyup', { key: 'Enter' })
		await flushPromises()
		expect(verify2FA).toHaveBeenCalledWith({ pre_auth_token: 't', code: '123456' })
		expect(localStorage.getItem('access_token')).toBe('a')
		expect(localStorage.getItem('refresh_token')).toBe('r')
		expect(localStorage.getItem('expires_at')).toBe('1')
		expect(JSON.parse(localStorage.getItem('user')).username).toBe('root')
		expect($router.push).toHaveBeenCalledWith('/')
		wrapper.unmount()
	})

	it('returns to the password step when the pre-auth token is rejected', async () => {
		const verify2FA = () => Promise.reject(Object.assign(new Error('expired'), { response: { status: 400, data: { success: 20006, message: 'expired' } } }))
		const { wrapper, $router } = mountWithApi(preAuth, verify2FA)
		await submitPassword(wrapper)
		await wrapper.find('input').setValue('123456')
		await wrapper.find('button.is-primary').trigger('click')
		await flushPromises()
		expect(wrapper.findAll('input')).toHaveLength(2)
		expect(wrapper.find('.notification').text()).toContain('expired')
		expect($router.push).not.toHaveBeenCalled()
		wrapper.unmount()
	})

	it('sends a recovery code after the toggle', async () => {
		const verify2FA = vi.fn(() => Promise.resolve({ data: { success: 200, data: session } }))
		const { wrapper } = mountWithApi(preAuth, verify2FA)
		await submitPassword(wrapper)
		await wrapper.find('a').trigger('click')
		const input = wrapper.find('input')
		expect(input.attributes('inputmode')).toBeUndefined()
		await input.setValue('abcde-fghij')
		await wrapper.find('button.is-primary').trigger('click')
		await flushPromises()
		expect(verify2FA).toHaveBeenCalledWith({ pre_auth_token: 't', recovery_code: 'abcde-fghij' })
		wrapper.unmount()
	})
})
