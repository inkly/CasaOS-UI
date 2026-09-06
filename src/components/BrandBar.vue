<template>
	<div class="brand-bar is-flex is-align-items-flex-end has-text-white">
		<figure class="image _is-136x26 mb-3">
			<img alt="logo" srcset="../assets/img/logo/logo.svg 2x, ../assets/img/logo/logo.png 1x">
		</figure>
		<span class="intro-text ml-4">Made with ❤️ by IceWhale and YOU!</span>

	</div>
</template>

<script>
export default {
	name: 'brand-bar',
}
</script>

<style lang="scss" scoped>
.brand-bar {
	position: fixed;
	left: 2rem;
	bottom: 0;
	//z-index: 10;

	span {
		//font-size: 1.125rem;
		margin-bottom: 7px;
	}

	.intro-text {
		font-weight: 400;
		font-size: 0.875rem;
		line-height: 1.25rem;
		color: var(--casa-on-glass-dim);

		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;

		vertical-align: text-bottom;
	}
}

@media screen and (max-width: 480px) {
	.brand-bar {
		left: 0;
		bottom: 3rem;
		display: flex;
		width: 100%;
		justify-content: center;
		font-size: 0.875rem;

		.image.is-32x32 {
			height: 24px;
			width: 24px;
		}

		.is-size-4 {
			font-size: 1.25rem !important;
		}
	}
}

._is-136x26 {
	width: 8.5rem;
	height: 1.625rem;
}
</style>
