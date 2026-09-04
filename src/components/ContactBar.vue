<template>
	<div class="contact-bar is-flex is-align-items-center has-text-white">

		<b-tooltip :label="$t('Submit a feedback or report an issue')" content-class="contact-tip" position="is-top"
			type="is-primary">
			<a @click="showFeedback">
				<b-icon icon="eedback" pack="casa"></b-icon>
			</a>
		</b-tooltip>

		<b-tooltip :label="$t('Join Discord')" content-class="contact-tip" position="is-top" type="is-primary">
			<a rel="noopener" href="https://discord.gg/knqAbbBbeX" target="_blank"
				@click="$messageBus('connect_discord')">
				<b-icon icon="discord" pack="casa"></b-icon>
			</a>
		</b-tooltip>

		<b-tooltip :label="$t('Visit our Github')" content-class="contact-tip" position="is-top" type="is-primary">
			<a rel="noopener" href="https://github.com/IceWhaleTech/CasaOS" target="_blank"
				@click="$messageBus('connect_github')">
				<b-icon icon="github" pack="casa"></b-icon>
			</a>
		</b-tooltip>

		<b-tooltip :label="$t('Share CasaOS')" content-class="contact-tip" position="is-top" type="is-primary">
			<a @click="showShareModal">
				<b-icon icon="chat" pack="casa"></b-icon>
			</a>
		</b-tooltip>

	</div>
</template>

<script>
import FeedbackPanel from './feedback/FeedbackPanel.vue'
import ShareModal from '@/components/share/ShareModal.vue'


export default {
	name: "contact-bar",
	methods: {
		showFeedback() {
			// messageBus :: feedback
			this.$messageBus('connect_feedback');
			this.$buefy.modal.open({
				parent: this,
				component: FeedbackPanel,
				hasModalCard: true,
				customClass: 'feedback-modal',
				trapFocus: true,
				canCancel: [],
				scroll: "keep",
				animation: "zoom-in",
			})
		},

		showShareModal() {
			// messageBus :: share
			this.$messageBus('connect_sharecasaos');
			this.$buefy.modal.open({
				parent: this,
				component: ShareModal,
				hasModalCard: true,
				customClass: 'network-storage-modal',
				trapFocus: true,
				canCancel: [],
				scroll: "keep",
				animation: "zoom-in",
			})
		}
	},
}
</script>

<style lang="scss" scoped>
.contact-bar {
	position: fixed;
	right: 1.375rem;
	bottom: 0;
	//z-index: 10;

	a {
		color: #fff;
		margin: 0.625rem;
		display: flex;
		align-items: center;

		&:hover {
			color: #fff;
		}
	}
}

@media screen and (max-width: 480px) {
	.contact-bar {
		right: 0;
		bottom: 0rem;
		background-color: transparent;
		backdrop-filter: none;
		display: flex;
		justify-content: center;
		width: 100%;
	}
}
</style>

<style lang="scss">
// `is-primary` already paints the bubble and its arrow; these two are the only
// things the old popper box had that a Buefy tooltip does not: the drop shadow
// (dropped globally by common/_others.scss) and a 6px instead of 5px radius.
.b-tooltip .tooltip-content.contact-tip {
	box-shadow: 0px 1px 2px 1px rgba(0, 1, 0, 0.2);
	border-radius: 6px;
}
</style>
