<template>
	<section aria-modal="true"
		class="app-iframe-overlay"
		role="dialog"
		:aria-label="appName">
		<transition name="c-zoom-in" appear>
			<div class="app-iframe-dialog">
				<header class="app-iframe-header is-flex is-align-items-center">
					<h1 class="app-iframe-title is-flex-grow-1 mb-0">
						{{ appName }}
					</h1>
					<button class="app-iframe-close"
						type="button"
						:aria-label="$t('Close')"
						:title="$t('Close')"
						@click="$emit('close')">
						<b-icon custom-size="casa-24px" icon="close-outline" pack="casa" />
					</button>
				</header>
				<div class="app-iframe-content">
					<iframe :src="url"
						:title="appName"
						allow="autoplay; fullscreen"
						allowfullscreen
						class="app-iframe"></iframe>
				</div>
			</div>
		</transition>
	</section>
</template>

<script>
export default {
	name: 'AppIframe',
	props: {
		appName: {
			type: String,
			default: '',
		},
		url: {
			type: String,
			required: true,
		},
	},
}
</script>

<style lang="scss" scoped>
.app-iframe-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow: auto;
  background: rgba(0, 0, 0, 0.8);
}

.app-iframe-dialog {
  display: flex;
  flex-direction: column;
  width: 90vw;
  height: 90vh;
  max-width: 81rem;
  min-height: 0;
  overflow: hidden;
  background: var(--casa-surface);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.25);
}

.app-iframe-header {
  flex: 0 0 3.5rem;
  min-height: 3.5rem;
  padding: 1.25rem 1.25rem 0.5rem 1.5rem;
  color: var(--casa-text-emphasis);
  background-color: var(--casa-surface-head);
  border-bottom: 1px solid var(--casa-divider);
}

.app-iframe-title {
  overflow: hidden;
  color: inherit;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-iframe-close {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 2.25rem;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  color: inherit;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 0.25rem;
}

.app-iframe-close:hover,
.app-iframe-close:focus-visible {
  background: rgba(0, 0, 0, 0.08);
}

.app-iframe-close:focus {
  outline: 2px solid var(--casa-focus-ring);
  outline-offset: 2px;
}

.app-iframe-content {
  flex: 1 1 auto;
  min-height: 0;
  background: var(--casa-surface);
}

.app-iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}

@media screen and (max-width: 768px) {
  .app-iframe-overlay {
    padding: 0;
  }

  .app-iframe-dialog {
    width: 100%;
    height: 100%;
    border-radius: 0;
  }
}
</style>
