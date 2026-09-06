<template>
	<div class="contact-bar is-flex is-align-items-center has-text-white">

		<b-tooltip :label="$t('Report an issue')" content-class="contact-tip" position="is-top" type="is-primary">
			<a rel="noopener" href="https://github.com/inkly/CasaOS/issues" target="_blank">
				<b-icon icon="eedback" pack="casa"></b-icon>
			</a>
		</b-tooltip>

		<b-tooltip :label="$t('Visit our Github')" content-class="contact-tip" position="is-top" type="is-primary">
			<a rel="noopener" href="https://github.com/inkly/CasaOS" target="_blank">
				<b-icon icon="github" pack="casa"></b-icon>
			</a>
		</b-tooltip>

	</div>
</template>

<script>
export default {
	name: 'contact-bar',
}
</script>

<style lang="scss" scoped>
.contact-bar {
	position: fixed;
	right: 1.375rem;
	bottom: 0;
	//z-index: 10;

	a {
		color: var(--casa-on-glass);
		margin: 0.625rem;
		display: flex;
		align-items: center;

		&:hover {
			color: var(--casa-on-glass);
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

// A Buefy tooltip centres itself on its trigger and has no overflow handling,
// and this bar is pinned to the right edge, so the last one hangs off the
// window: measured at 1280px, 11px past it in English and 26px in Dutch.
// Anchor that one to the bar instead and put its arrow back over the icon,
// which is what popper.js used to do here with preventOverflow.
.contact-bar .b-tooltip:last-child .tooltip-content.contact-tip {
	left: auto;
	right: -0.625rem;
	transform: none;

	&::before {
		left: auto;
		right: 15px;
		transform: none;
	}
}
</style>
