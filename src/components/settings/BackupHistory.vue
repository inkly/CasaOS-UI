<template>
	<div>
		<div class="is-flex is-align-items-center mb-2">
			<p class="has-text-full-03 is-size-7 is-flex-grow-1">
				{{ $t('The last few hundred runs, newest first. Failures are kept too — a record that only showed successes would hide a box backing nothing up.') }}
			</p>
			<b-button :loading="isLoading" rounded size="is-small" @click="load">{{ $t('Refresh') }}</b-button>
		</div>

		<b-message v-if="error" class="mb-0" size="is-small" type="is-danger">{{ error }}</b-message>

		<b-table v-else :data="runs" :loading="isLoading" :mobile-cards="false" class="is-size-7">
			<b-table-column v-slot="{ row }" :label="$t('App')" field="app">{{ row.app }}</b-table-column>

			<b-table-column v-slot="{ row }" :label="$t('Destination')" field="destination">
				{{ row.destination }}
			</b-table-column>

			<b-table-column v-slot="{ row }" :label="$t('When')" field="started_at">
				{{ new Date(row.started_at).toLocaleString() }}
			</b-table-column>

			<b-table-column v-slot="{ row }" :label="$t('Result')" field="error">
				<b-tag v-if="!row.error" type="is-success">{{ $t('Done') }}</b-tag>
				<b-tooltip v-else :label="row.error" multilined position="is-left" type="is-dark">
					<b-tag type="is-danger">{{ $t('Failed') }}</b-tag>
				</b-tooltip>
			</b-table-column>

			<b-table-column v-slot="{ row }" :label="$t('Copied')" field="copied" numeric>
				{{ row.copied }}
			</b-table-column>

			<b-table-column v-slot="{ row }" :label="$t('Stopped')" field="containers_stopped">
				<!-- a copy taken from a running app may not restore, which is worth
					knowing about a backup before trying to restore it -->
				<span v-if="row.containers_stopped">{{ $t('Yes') }}</span>
				<span v-else class="has-text-warning">{{ $t('No') }}</span>
			</b-table-column>

			<template #empty>
				<p class="has-text-centered has-text-full-03 is-size-7 py-4">
					{{ $t('No backup has run yet.') }}
				</p>
			</template>
		</b-table>
	</div>
</template>

<script>
export default {
	name: 'backup-history',
	data() {
		return { runs: [], isLoading: false, error: '' }
	},
	mounted() {
		this.load()
	},
	methods: {
		async load() {
			this.isLoading = true
			this.error = ''
			try {
				const res = await this.$api.backup.getRuns()
				this.runs = res.data.data || []
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
