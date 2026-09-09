<template>
	<section class="modal-card-body containers-tab">
		<div class="is-flex is-align-items-center mb-2">
			<p class="has-text-full-03 is-size-7 is-flex-grow-1">
				{{ $t('One row per container of this app, as Docker sees it right now.') }}
			</p>
			<b-button :loading="isLoading" rounded size="is-small" @click="load">
				{{ $t('Refresh') }}
			</b-button>
		</div>

		<b-message v-if="error" class="mb-0" size="is-small" type="is-danger">
			{{ error }}
		</b-message>

		<b-table v-else :data="rows" :loading="isLoading" :mobile-cards="false" class="is-size-7">
			<b-table-column v-slot="{ row }" :label="$t('Service')" field="service">
				<span class="has-text-weight-medium">{{ row.service }}</span>
				<!-- Almost every service holds a single container and naming it would say
					nothing; a scaled one needs the name to tell its replicas apart. -->
				<div v-if="row.replicas > 1" class="containers-tab__mono has-text-full-03">
					{{ row.name }}
				</div>
			</b-table-column>

			<b-table-column v-slot="{ row }" :label="$t('State')" field="state">
				<b-tag v-if="stateOf(row)" :title="$t(stateOf(row).hint)" :type="stateOf(row).type">
					{{ $t(stateOf(row).label) }}
				</b-tag>
				<span v-else>{{ row.state }}</span>
			</b-table-column>

			<b-table-column v-slot="{ row }" :label="$t('Health')" field="health">
				<b-tag v-if="healthOf(row).tag" :type="healthOf(row).tag.type">
					{{ $t(healthOf(row).tag.label) }}
				</b-tag>
				<span v-else class="has-text-full-03">{{ healthOf(row).text ? $t(healthOf(row).text) : '-' }}</span>
			</b-table-column>

			<b-table-column v-slot="{ row }" :label="$t('Image')" field="image">
				<span class="containers-tab__mono">{{ row.image }}</span>
			</b-table-column>

			<b-table-column v-slot="{ row }" :label="$t('Published ports')" field="ports">
				<span v-if="!row.ports.length" class="has-text-full-03">{{ $t('None') }}</span>
				<template v-else>
					<div v-for="port in row.ports" :key="port" class="containers-tab__mono">
						{{ port }}
					</div>
				</template>
			</b-table-column>

			<b-table-column v-slot="{ row }" :label="$t('Uptime')" field="uptime">
				<span v-if="row.uptime">{{ row.uptime }}</span>
				<span v-else class="has-text-full-03">-</span>
			</b-table-column>

			<b-table-column v-slot="{ row }" :label="$t('Exit code')" field="exitCode" numeric>
				<span v-if="row.exitCode !== null">{{ row.exitCode }}</span>
				<span v-else class="has-text-full-03">-</span>
			</b-table-column>

			<b-table-column v-slot="{ row }" :label="$t('Actions')">
				<div class="containers-tab__actions">
					<b-tooltip :label="logsTooltip(row)" position="is-left" type="is-dark">
						<b-button :disabled="!row.id"
							class="mr-1"
							icon-left="text-box-outline"
							rounded
							size="is-small"
							@click="open(row, 'logs')" />
					</b-tooltip>
					<b-tooltip :label="terminalTooltip(row)" position="is-left" type="is-dark">
						<b-button :disabled="row.state !== 'running'"
							icon-left="console"
							rounded
							size="is-small"
							@click="open(row, 'terminal')" />
					</b-tooltip>
				</div>
			</b-table-column>

			<template #empty>
				<p class="has-text-centered has-text-full-03 is-size-7 py-4">
					{{ $t('Docker knows no container for this app.') }}
				</p>
			</template>
		</b-table>
	</section>
</template>

<script>
import { CONTAINER_STATES, containerRows, healthCell } from './containerSummary'

export default {
	name: 'ContainersTab',
	props: {
		appId: { type: String, required: true },
	},
	emits: ['open'],
	data() {
		return {
			rows: [],
			isLoading: false,
			error: '',
		}
	},
	mounted() {
		this.load()
	},
	methods: {
		stateOf(row) {
			return CONTAINER_STATES[row.state]
		},

		healthOf(row) {
			return healthCell(row)
		},

		terminalTooltip(row) {
			// A shell can only be opened inside a process that is running; saying so
			// beats a button that fails when pressed.
			if (!row.id)
				return this.$t('The compose file declares this service, but Docker runs no container for it.')

			return row.state === 'running' ? this.$t('Terminal') : this.$t('Only a running service has a terminal.')
		},

		logsTooltip(row) {
			return row.id ? this.$t('Logs') : this.$t('The compose file declares this service, but Docker runs no container for it.')
		},

		// The row names the exact container, so a service with several of them opens the
		// one that was clicked instead of whichever the panel would have guessed.
		open(row, tab) {
			this.$emit('open', { service: row.service, containerId: row.id, tab })
		},

		async load() {
			this.isLoading = true
			this.error = ''
			try {
				const res = await this.$openAPI.appManagement.compose.composeAppContainers(this.appId)
				this.rows = containerRows(res.data.data)
			} catch (error) {
				const data = error.response && error.response.data
				this.error = (data && data.message) || error.message
			} finally {
				this.isLoading = false
			}
		},
	},
}
</script>

<style lang="scss" scoped>
.containers-tab {
  &__mono {
    font-family: 'Monaco', 'Consolas', monospace;
    word-break: break-all;
  }

  &__actions {
    white-space: nowrap;
  }
}
</style>
