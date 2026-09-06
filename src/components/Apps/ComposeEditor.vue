<template>
	<section class="modal-card-body compose-editor">
		<p class="has-text-full-03 is-size-7 mb-2">
			{{ $t('Edit the Docker Compose file of this app directly. Changes are validated before being applied.') }}
		</p>

		<b-message class="mb-3" size="is-small" type="is-warning">
			{{ $t("Values defined in the app's .env are kept as {ref}; other environment values are shown resolved.", { ref: '${VAR}' }) }}
		</b-message>

		<Codemirror :options="cmOptions"
			:value="draft"
			class="compose-editor__area"
			@input="onInput" />

		<b-message v-if="localError" class="mt-3 mb-0" size="is-small" type="is-danger">
			{{ localError }}
		</b-message>

		<b-message v-else-if="serverError" class="mt-3 mb-0" size="is-small" type="is-danger">
			{{ serverError }}
		</b-message>

		<div v-if="isDirty && !localError && !serverError" class="mt-3 has-text-full-03 is-size-7">
			{{ $t('Unsaved changes.') }}
			<a href="#" @click.prevent="reset">{{ $t('Discard') }}</a>
		</div>
	</section>
</template>

<script>
import { validateComposeYAML } from './composeValidation'
import Codemirror from '@/components/basicComponents/CodeMirror.vue'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/monokai.css'
import 'codemirror/mode/yaml/yaml.js'
import 'codemirror/addon/selection/active-line.js'

// Validation codes from composeValidation.js mapped to translatable messages.
const MESSAGES = {
	'empty': 'The Compose file is empty.',
	'syntax': 'This is not valid YAML.',
	'not-a-mapping': 'A Compose file must be a mapping, starting with keys such as "name" and "services".',
	'no-services': 'This Compose file declares no services.',
	'main-service-missing': 'The top-level "name" must match one of the services, to designate the main application.',
}

export default {
	name: 'ComposeEditor',
	components: { Codemirror },
	props: {
		appId: { type: String, required: true },
		value: { type: String, default: '' },
	},
	emits: ['applied', 'state'],
	data() {
		return {
			draft: this.value,
			isApplying: false,
			serverError: '',
			cmOptions: {
				mode: 'text/x-yaml',
				theme: 'monokai',
				lineNumbers: true,
				lineWrapping: true,
				styleActiveLine: true,
				tabSize: 2,
				indentUnit: 2,
				indentWithTabs: false,
			},
		}
	},
	computed: {
		validation() {
			return validateComposeYAML(this.draft)
		},

		localError() {
			if (this.validation.ok)
				return ''

			const message = this.$t(MESSAGES[this.validation.code] || MESSAGES.syntax)
			return this.validation.detail ? `${message} ${this.validation.detail}` : message
		},

		isDirty() {
			return this.draft !== this.value
		},

		canApply() {
			return this.validation.ok && this.isDirty && !this.isApplying
		},
	},
	watch: {
		value(next) {
			// The panel reloaded the app: drop the draft rather than silently keeping
			// edits made against a version that no longer exists.
			this.draft = next
			this.serverError = ''
		},
		canApply: 'emitState',
		isApplying: 'emitState',
		isDirty: 'emitState',
	},
	mounted() {
		this.emitState()
	},
	methods: {
		emitState() {
			this.$emit('state', {
				canApply: this.canApply,
				isApplying: this.isApplying,
				isDirty: this.isDirty,
			})
		},

		onInput(code) {
			this.draft = code
			this.serverError = ''
		},

		/**
		 * Validate server-side with dry_run, then apply for real. The dry run is what
		 * surfaces port conflicts and Compose Specification errors that cannot be
		 * detected in the browser.
		 */
		async apply() {
			if (!this.canApply)
				return

			this.isApplying = true
			this.serverError = ''
			const compose = this.$openAPI.appManagement.compose

			try {
				await compose.applyComposeAppSettings(this.appId, this.draft, true, true)
			} catch (error) {
				this.serverError = this.readServerError(error)
				this.isApplying = false
				return
			}

			try {
				await compose.applyComposeAppSettings(this.appId, this.draft, false, true)
				this.$buefy.toast.open({
					message: this.$t('Changes are being applied.'),
					type: 'is-success',
				})
				this.$emit('applied', this.draft)
			} catch (error) {
				this.serverError = this.readServerError(error)
			} finally {
				this.isApplying = false
			}
		},

		/**
		 * `ports_in_use` is the only structured error the compose PUT returns, and the
		 * bare message ("there are ports in use") names none of them. Append them.
		 */
		portsInUse(data) {
			const inUse = data && data.data && data.data.ports_in_use
			if (!inUse)
				return ''

			return [].concat(inUse.TCP || [], inUse.UDP || []).join(', ')
		},

		readServerError(error) {
			const data = error && error.response && error.response.data
			if (data && data.message) {
				const ports = this.portsInUse(data)
				return ports ? `${data.message}: ${ports}` : data.message
			}

			if (typeof data === 'string' && data)
				return data

			if (error && error.message)
				return error.message

			return this.$t('The server rejected this Compose file.')
		},

		reset() {
			this.draft = this.value
			this.serverError = ''
		},
	},
}
</script>

<style lang="scss" scoped>
.compose-editor {
  &__area {
    ::v-deep .CodeMirror {
      height: 26rem;
      border-radius: 0.5rem;
      font-size: 0.8125rem;
    }
  }
}
</style>
