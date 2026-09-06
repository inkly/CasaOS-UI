<template>
	<div class="modal-card">
		<!-- Modal-Card Header Start -->
		<header class="modal-card-head">
			<div class="is-flex-grow-1">
				<h3 class="title is-header">{{ $t('Update') }}</h3>
			</div>
			<b-icon class="close-button" icon="close-outline" pack="casa" @click="$emit('close');" />
		</header>
		<!-- Modal-Card Header End -->
		<!-- Modal-Card Body Start -->
		<section class="modal-card-body ">
			<div ref="log" class="node-card fixed-height">
				<div v-if="!isUpdating" v-dompurify-html="markdownToHtml" class="update-info-container  is-size-14px"></div>
				<pre v-else class="update-log is-size-14px">{{ updateLogText }}</pre>
			</div>
		</section>
		<!-- Modal-Card Body End -->
		<!-- Modal-Card Footer Start -->
		<footer class="modal-card-foot is-flex is-align-items-center">
			<div class="is-flex-grow-1"></div>
			<div>
				<b-button :label="$t('Upgrade Now')" :loading="isUpdating" expaned rounded type="is-primary"
					@click="updateSystem" />
			</div>
		</footer>
		<!-- Modal-Card Footer End -->
	</div>
</template>

<script>
import { marked } from 'marked'

export default {
	props: {
		changeLog: {
			type: String,
			default: '',
		},
	},
	data() {
		return {
			timer: 0,
			updateTimer: 0,
			reloading: false,
			isUpdating: false,
			markdown: ``,
			updateLogs: ``,
		}
	},
	computed: {
		markdownToHtml() {
			return marked.parse(this.changeLog)
		},
		updateLogText() {
			// The installer writes plain text; drop the colour codes a sub-command may leave behind.
			// eslint-disable-next-line no-control-regex -- strips ANSI colour codes from the update log
			return this.updateLogs.replace(/\u001B\[[0-9;]*m/g, '')
		},
	},
	watch: {
		updateLogs() {
			this.$nextTick(() => {
				const log = this.$refs.log
				if (log)
					log.scrollTop = log.scrollHeight
			})
		},
	},
	methods: {
		/**
		 * @description: Update System Version and check update state
		 * @return {*} void
		 */
		async updateSystem() {
			this.isUpdating = true
			await this.$api.sys.updateCasaOS()
			// this.checkUpdateState();
			this.getUpdateLogs()
		},

		/**
		 * @description: Get update logs
		 * @return {*} void
		 */
		getUpdateLogs() {
			this.updateTimer = setInterval(() => {
				this.$api.file.getContent(`/var/log/casaos/upgrade.log`).then((res) => {
					this.updateLogs = res.data.data
					if (this.updateLogs.includes(`CasaOS upgrade successfully`)) {
						clearInterval(this.updateTimer)
						// responses still in flight carry the same line: reload once
						if (this.reloading)
							return
						this.reloading = true
						localStorage.setItem('is_update', 'true')
						this.reloadWhenBackendIsBack()
					} else if (this.updateLogs.includes(`CasaOS upgrade failed`)) {
						this.$buefy.toast.open({
							message: this.$t(`There seems to be a problem with the upgrade process, please try again!`),
							type: 'is-danger',
						})
						clearInterval(this.updateTimer)
						setTimeout(() => {
							this.isUpdating = false
						}, 1000)
					}
				}).catch(() => {}) // the services restart mid-update; the log comes back with them
			}, 200)
		},
		/**
		 * The upgrade restarts every service and rotates the token keys, so this
		 * session is over either way. Signing out through the router awaited an
		 * API call in its guard; started while the services restarted, that call
		 * settled only after the user had signed in again, and the guard's /logout
		 * branch then removed the fresh tokens. The session is cleared here, and
		 * the page reloads - into the UI just installed - once the backend answers,
		 * or after two minutes regardless. Each probe is given three seconds: a
		 * probe left pending by a restarting service must not hold the reload.
		 */
		reloadWhenBackendIsBack() {
			for (const key of ['access_token', 'refresh_token', 'user', 'wallpaper'])
				localStorage.removeItem(key)

			const deadline = Date.now() + 120000
			const probe = () => Promise.race([
				this.$api.users.getUserStatus(),
				new Promise((_, reject) => setTimeout(() => reject(new Error('no answer')), 3000)),
			])
			const poll = () => probe()
				.then(() => location.reload())
				.catch(() => {
					if (Date.now() < deadline)
						setTimeout(poll, 1000)
					else
						location.reload()
				})
			setTimeout(poll, 1000)
		},
		/**
		 * @description: check update state if is_need is false then reload page
		 * @return {*} void
		 */
		checkUpdateState() {
			this.timer = setInterval(() => {
				this.$api.sys.getVersion().then((res) => {
					if (res.data.success == 200) {
						if (!res.data.data.is_need) {
							clearInterval(this.timer)
							location.reload()
						}
					}
				})
			}, 3000)
		},
	},
}
</script>

<style lang="scss">
.fixed-height {
	max-height: 20rem;
	overflow-y: auto;
}

.update-log {
	min-height: 20rem;
	padding: 0;
	background: transparent;
	color: inherit;
	line-height: 1.5rem;
	white-space: pre-wrap;
	word-break: break-all;
}

.update-info-container {
	line-height: 1.5rem;
	border-radius: 4px;
	overflow: hidden;
	min-height: 20rem;

	h1,
	h2,
	h3,
	h4,
	h5,
	h6 {
		font-weight: bold;
		margin-bottom: 0.4rem;
	}

	h1 {
		font-size: 2em;
	}

	h2 {
		font-size: 1.5em;
	}

	h3 {
		font-size: 1.17em;
	}

	h4 {
		font-size: 1em;
	}

	h5 {
		font-size: 0.83em;
	}

	h6 {
		font-size: 0.67em;
	}

	ul {
		margin-bottom: 0.5em;

		li {
			list-style: disc;
			margin-left: 1rem;
		}
	}
}
</style>
