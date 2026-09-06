<template>
	<div class="modal-card">
		<!-- Modal-Card Header Start -->
		<header class="modal-card-head">
			<div class="is-flex-grow-1">
				<h3 class="title is-3">{{ $t('Share CasaOS') }}</h3>
			</div>
			<div>
				<button class="delete" type="button" @click="$emit('close')"/>
			</div>
		</header>
		<!-- Modal-Card Header End -->
		<!-- Modal-Card Body Start -->
		<section class="modal-card-body ">
			<div class="node-card  mt-5 mb-5">

				<div>
					<div class=" is-size-14px">{{
						$t('Please invite more friends who are concerned about family and data privacy to join and use CasaOS.')
						}}
					</div>

					<b-image :src="require('@/assets/img//social/share_img.png')"
							 class="share-img-shadow share-img"></b-image>
				</div>

				<div class="buttons is-justify-content-center mb-6 mt-4">
					<a v-for="site in shareSites" :key="site" :class="`share-network-${site}`"
					   href="javascript:void(0)" @click="share(site)">
						<b-button :icon-left="site" :type="`is-${site}`" class="ml-3 mr-3" icon-pack="casa">
							Share
						</b-button>
					</a>
				</div>

			</div>
		</section>
		<!-- Modal-Card Body End -->
	</div>
</template>

<script>
import {marked} from 'marked'
import shareTo  from '@/service/share'

export default {
	props: {
		changeLog: {
			type: String,
			default: ""
		},
	},
	data() {
		return {
			timer: 0,
			updateTimer: 0,
			githubUrl: `https://raw.githubusercontent.com/IceWhaleTech/logo/main/casaos/0.4/casaos_social_share.png`,
			shareTitle: `I'm using CasaOS, a simple, easy-to-use, elegant open-source home cloud system, try it like me.`,
			shareSites: [
				'facebook',
				'twitter',
				'reddit'
			]
		};
	},
	computed: {
		markdownToHtml() {
			return marked.parse(this.changeLog);
		}
	},
	methods: {
		share(site) {
			shareTo(site, {
				url: this.githubUrl,
				title: this.shareTitle,
				description: this.shareTitle,
				hashtags: 'homecloud,opensource'
			});
		},

		/**
		 * @description: Update System Version and check update state
		 * @return {*} void
		 */
		async updateSystem() {
			this.isUpdating = true;
			await this.$api.sys.updateCasaOS();
			this.getUpdateLogs()
		},

		/**
		 * @description: Get update logs
		 * @return {*} void
		 */
		getUpdateLogs() {
			this.updateTimer = setInterval(() => {
				this.$api.file.getContent(`/var/log/casaos/upgrade.log`).then(res => {

					this.updateLogs = res.data.data;
					if (this.updateLogs.includes(`CasaOS upgrade successfully`)) {
						clearInterval(this.updateTimer);
						setTimeout(() => {
							location.reload();
						}, 1000);
					} else if (this.updateLogs.includes(`CasaOS upgrade failed`)) {
						this.$buefy.toast.open({
							message: this.$t(`There seems to be a problem with the upgrade process, please try again!`),
							type: 'is-danger'
						})
						clearInterval(this.updateTimer);
						setTimeout(() => {
							this.isUpdating = false;
						}, 1000);

					}
				})
			}, 200);
		},
		/**
		 * @description: check update state if is_need is false then reload page
		 * @return {*} void
		 */
		checkUpdateState() {
			this.timer = setInterval(() => {
				this.$api.sys.getVersion().then(res => {
					if (res.data.success == 200) {
						if (!res.data.data.is_need) {
							clearInterval(this.timer);
							location.reload();
						}
					}
				})
			}, 3000)
		},
	},
}
</script>

<style lang="scss">
.share-img-shadow {
	box-shadow: 0px 16px 24px 2px rgba(115, 120, 128, 0.4);
}

.share-img {
	margin: 3rem 6rem 4rem 6rem;
}
</style>
