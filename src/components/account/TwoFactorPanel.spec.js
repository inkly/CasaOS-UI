// @vitest-environment happy-dom
import Buefy from 'buefy'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import i18n from '@/plugins/i18n'
import TwoFactorPanel from '@/components/account/TwoFactorPanel.vue'

vi.mock('@/assets/lang', () => ({ default: { en_us: {} } }))
vi.mock('qrcode', () => ({ toDataURL: vi.fn(() => Promise.resolve('data:image/png;base64,QQ==')) }))

const codes = ['aaaaa-11111', 'bbbbb-22222', 'ccccc-33333', 'ddddd-44444', 'eeeee-55555', 'fffff-66666', 'ggggg-77777', 'hhhhh-88888']

const reject = (success, message) => () => Promise.reject(Object.assign(new Error(message), { response: { status: 400, data: { success, message } } }))

function mountPanel(totpEnabled, users) {
	return mount(TwoFactorPanel, {
		global: {
			plugins: [Buefy, i18n],
			mocks: {
				$api: { users },
				$store: { state: { user: { id: 1, username: 'root', totp_enabled: totpEnabled } } },
				$buefy: { toast: { open: vi.fn() } },
			},
		},
	})
}

async function fill(wrapper, value) {
	await wrapper.find('input').setValue(value)
	await wrapper.findAll('button.button').at(-1).trigger('click')
	await flushPromises()
}

describe('twoFactorPanel', () => {
	it('walks from the password to the QR code to the recovery codes', async () => {
		const setup2FA = vi.fn(() => Promise.resolve({ data: { success: 200, data: { secret: 'ABC', otpauth_url: 'otpauth://totp/CasaOS:root?secret=ABC' } } }))
		const enable2FA = vi.fn(() => Promise.resolve({ data: { success: 200, data: { recovery_codes: codes } } }))
		const wrapper = mountPanel(false, { setup2FA, enable2FA })

		await fill(wrapper, 'secret')
		expect(setup2FA).toHaveBeenCalledWith({ password: 'secret' })
		expect(wrapper.find('img').attributes('src')).toMatch(/^data:image\/png/)
		expect(wrapper.find('pre').text()).toBe('ABC')

		await fill(wrapper, '123456')
		expect(enable2FA).toHaveBeenCalledWith({ code: '123456' })
		expect(wrapper.emitted('change')).toEqual([[true]])
		const shown = wrapper.find('pre').text()
		codes.forEach(code => expect(shown).toContain(code))
		wrapper.unmount()
	})

	it('keeps the QR code on screen when the code is wrong', async () => {
		const setup2FA = () => Promise.resolve({ data: { success: 200, data: { secret: 'ABC', otpauth_url: 'otpauth://x' } } })
		const wrapper = mountPanel(false, { setup2FA, enable2FA: reject(10015, 'wrong code') })
		await fill(wrapper, 'secret')
		await fill(wrapper, '000000')
		expect(wrapper.find('img').exists()).toBe(true)
		expect(wrapper.text()).toContain('wrong code')
		expect(wrapper.emitted('change')).toBeUndefined()
		wrapper.unmount()
	})

	it('disables with the password', async () => {
		const disable2FA = vi.fn(() => Promise.resolve({ data: { success: 200 } }))
		const wrapper = mountPanel(true, { disable2FA })
		await fill(wrapper, 'secret')
		expect(disable2FA).toHaveBeenCalledWith({ password: 'secret' })
		expect(wrapper.emitted('change')).toEqual([[false]])
		expect(wrapper.emitted('done')).toHaveLength(1)
		wrapper.unmount()
	})
})
