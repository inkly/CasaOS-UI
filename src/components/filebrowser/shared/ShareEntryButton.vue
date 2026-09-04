<template>
	<div>

		<div :class="{ 'active': active }" class="is-flex list-item new-list-item" @click.prevent="$emit('open')">

			<b-tooltip :active="tipVisible" :triggers="[]" always content-class="share-tip" position="is-right">
				<template #content>
					<div class="is-flex ">
						{{ $t('Start sharing your files on the local network.') }}
						<div class="is-clickable ml-1 is-flex is-align-items-center" @click.stop="hideTip">
							<b-icon icon="close-xs" pack="casa"></b-icon>
						</div>
					</div>
				</template>
				<div class="cover mr-2 is-flex-shrink-0 is-flex is-align-items-center none-click">
					<b-icon icon="share" pack="casa"></b-icon>
				</div>
			</b-tooltip>
			<div><span>{{ $t('Shared') }}</span></div>

		</div>

	</div>
</template>

<script>

const sharedInitData = "shared_init_data";
import events from '@/events/events';

export default {
	props: {
		active: {
			type: Boolean,
			default: false
		},
	},
	data() {
		return {
			tipVisible: false
		}
	},
	created() {

	},
	mounted() {
		this.checkInit()
		// this.showTip()
	},

	methods: {
		async checkInit() {
			try {
				const res = await this.$api.users.getCustomStorage(sharedInitData)
				const resData = res.data.data
				if (resData) {
					if (!resData.isInit) {
						this.showTip()
					}
				} else {
					this.showTip()

				}
			} catch (error) {
				console.log(error);
			}
		},
		selectShare() {
			this.$EventBus.$emit(events.SELECT_SHARE);
			// this.$tours['myTour'].skip()
		},
		showTip() {
			setTimeout(() => {
				this.tipVisible = true
			}, 500)
		},
		hideTip() {
			this.tipVisible = false
			this.$api.users.setCustomStorage(sharedInitData, {
				isInit: true
			})
		}
	},

}
</script>

<style lang="scss" scoped>
.none-click {
	pointer-events: none;
}
</style>

<style lang="scss">
// Same bubble the popper drew. `is-always` pins opacity to 1, so the 1s fade-in
// has to be re-stated at a specificity that beats it.
.b-tooltip.is-always .tooltip-content.share-tip {
	background: #505459;
	color: #ffffff;
	padding: 0.35rem 0.4rem 0.35rem 0.75rem;
	box-shadow: 0px 1px 2px 1px rgba(0, 1, 0, 0.2);
	border-radius: 6px;

	&::before {
		border-right-color: #505459 !important;
	}

	&.fade-enter {
		opacity: 0;
	}

	&.fade-enter-active {
		transition: opacity 1s;
	}
}
</style>
