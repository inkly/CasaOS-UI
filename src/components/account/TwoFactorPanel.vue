<template>
	<div class="two-factor">
		<template v-if="step === 'password'">
			<p class="has-text-emphasis-04 has-text-gray-font mb-3">
				{{ $t('Confirm your password to start setting up two-factor authentication.') }}
			</p>
			<b-field :message="error" :type="{ 'is-danger': error }" class="mb-3 has-text-light">
				<b-input v-model="password" :placeholder="$t('Password')" autocomplete="current-password" autofocus password-reveal type="password" @keyup.enter="setup" />
			</b-field>
			<b-button :label="$t('Continue')" :loading="busy" expanded rounded type="is-dark" @click="setup" />
		</template>

		<template v-else-if="step === 'qr'">
			<p class="has-text-emphasis-04 has-text-gray-font mb-3">
				{{ $t('Scan this QR code with your authenticator app, then enter the 6-digit code it shows.') }}
			</p>
			<div class="has-text-centered mb-3">
				<img :src="qr" :alt="$t('QR code for your authenticator app')" class="qr" width="192" height="192">
			</div>
			<p class="has-text-emphasis-04 has-text-gray-font mb-1">
				{{ $t("Can't scan? Enter this key instead") }}
			</p>
			<div class="is-flex is-align-items-center mb-3">
				<pre class="secret is-flex-grow-1 mr-2">{{ secret }}</pre>
				<b-button :label="$t('Copy')" rounded size="is-small" @click="copyText(secret)" />
			</div>
			<b-field :message="error" :type="{ 'is-danger': error }" class="mb-3 has-text-light">
				<b-input v-model="code" :has-counter="false" :placeholder="$t('Authentication code')" autocomplete="one-time-code" autofocus inputmode="numeric" maxlength="6" @keyup.enter="enable" />
			</b-field>
			<b-button :label="$t('Enable')" :loading="busy" expanded rounded type="is-dark" @click="enable" />
		</template>

		<template v-else-if="step === 'codes'">
			<p class="has-text-emphasis-04 has-text-gray-font mb-3">
				{{ $t('Two-factor authentication is on. Save these recovery codes somewhere safe: each one signs you in once if you lose your authenticator app, and they will not be shown again.') }}
			</p>
			<pre class="secret mb-3">{{ recoveryCodes.join('\n') }}</pre>
			<div class="is-flex">
				<b-button :label="$t('Copy')" class="mr-2" rounded @click="copyText(recoveryCodes.join('\n'))" />
				<b-button :label="$t('I have saved these codes')" expanded rounded type="is-dark" @click="$emit('done')" />
			</div>
		</template>

		<template v-else>
			<p class="has-text-emphasis-04 has-text-gray-font mb-3">
				{{ $t('Two-factor authentication is on. Confirm your password to turn it off; your recovery codes will stop working.') }}
			</p>
			<b-field :message="error" :type="{ 'is-danger': error }" class="mb-2 has-text-light">
				<b-input v-if="useCode" v-model="code" :has-counter="false" :placeholder="$t('Authentication code')" autocomplete="one-time-code" autofocus inputmode="numeric" maxlength="6" @keyup.enter="disable" />
				<b-input v-else v-model="password" :placeholder="$t('Password')" autocomplete="current-password" autofocus password-reveal type="password" @keyup.enter="disable" />
			</b-field>
			<a class="is-size-7" @click="toggleFactor">{{ useCode ? $t('Use your password instead') : $t('Use a code from your app instead') }}</a>
			<b-button :label="$t('Disable')" :loading="busy" class="mt-3" expanded rounded type="is-danger" @click="disable" />
		</template>
	</div>
</template>

<script>
import copy from 'clipboard-copy'

export default {
	name: 'TwoFactorPanel',
	emits: ['change', 'done'],
	data() {
		return {
			step: this.$store.state.user.totp_enabled ? 'disable' : 'password',
			password: '',
			code: '',
			useCode: false,
			secret: '',
			qr: '',
			recoveryCodes: [],
			error: '',
			busy: false,
		}
	},
	mounted() {
		this.focusInput()
	},
	methods: {
		// A field swapped in after a click never gets the browser's autofocus.
		focusInput() {
			this.$nextTick(() => {
				const input = this.$el.querySelector('input')
				if (input)
					input.focus()
			})
		},
		toggleFactor() {
			this.useCode = !this.useCode
			this.code = ''
			this.password = ''
			this.error = ''
			this.focusInput()
		},
		async setup() {
			if (!this.password) {
				return
			}
			this.busy = true
			try {
				const res = await this.$api.users.setup2FA({ password: this.password })
				// Lazy: the QR encoder is only needed on this screen.
				const { toDataURL } = await import('qrcode')
				this.qr = await toDataURL(res.data.data.otpauth_url, { margin: 4, width: 192 })
				this.secret = res.data.data.secret
				this.password = ''
				this.error = ''
				this.step = 'qr'
				this.focusInput()
			} catch (err) {
				this.fail(err)
			}
			this.busy = false
		},
		async enable() {
			if (!this.code) {
				return
			}
			this.busy = true
			try {
				const res = await this.$api.users.enable2FA({ code: this.code })
				this.recoveryCodes = res.data.data.recovery_codes
				this.error = ''
				this.$emit('change', true)
				this.step = 'codes'
			} catch (err) {
				// 10017: the pending secret is gone (a password login in between), start again.
				if (this.fail(err) === 10017) {
					this.step = 'password'
					this.focusInput()
				}
			}
			this.code = ''
			this.busy = false
		},
		async disable() {
			if (!(this.useCode ? this.code : this.password)) {
				return
			}
			this.busy = true
			try {
				await this.$api.users.disable2FA(this.useCode ? { code: this.code } : { password: this.password })
				this.$emit('change', false)
				this.$emit('done')
			} catch (err) {
				// 10017: it was not on any more.
				if (this.fail(err) === 10017) {
					this.$emit('change', false)
					this.$emit('done')
				}
			}
			this.busy = false
		},
		fail(err) {
			this.error = err.response?.data?.message || err.message
			return err.response?.data?.success
		},
		copyText(value) {
			copy(value)
			this.$buefy.toast.open({
				message: this.$t('Copied to clipboard'),
				type: 'is-success',
			})
		},
	},
}
</script>

<style lang="scss" scoped>
// The account panel sits in the top bar's dropdown, whose items are nowrap.
.two-factor {
	white-space: normal;
}

// Bulma caps any image inside a .navbar-item at 1.75rem, and the account panel
// is rendered in the top bar's dropdown: that squashed the QR to a 192x28 band.
// max-height: none lets width="192" and Bulma's height: auto keep it 1:1 square;
// max-width: 100% still shrinks it, squarely, on a narrow window.
.qr {
	max-height: none;
	image-rendering: pixelated;
}

.secret {
	user-select: all;
	white-space: pre-wrap;
	word-break: break-all;
}
</style>
