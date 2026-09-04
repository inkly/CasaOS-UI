/**
 * Replaces v-animate-css, which is Vue 2 only and untouched since 2019.
 *
 * Same plugin shape and same directive: `v-animate-css="{ classes, duration,
 * delay, iteration }"` (or a bare class name) drops animate.css classes on the
 * element and clears them once the animation ends. The library's modifiers
 * (click, hover, enter, exit) pulled in scrollmonitor and no call site used
 * one, so they are gone with it.
 */
export default {
	install(Vue, { animateCSSPath = '/css/animate.min.css' } = {}) {
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = animateCSSPath;
		document.head.appendChild(link);

		Vue.directive('animate-css', {
			bind(el, binding) {
				const value = typeof binding.value === 'string' ? { classes: binding.value } : binding.value;
				if (!value || !value.classes) {
					return;
				}

				const { classes, duration, delay, iteration } = value;
				if (duration) {
					el.style.animationDuration = `${duration}ms`;
				}
				if (delay) {
					el.style.animationDelay = `${delay}ms`;
				}
				if (iteration) {
					el.style.animationIterationCount = `${iteration}`;
				}

				const added = ['animated', ...classes.trim().split(/\s+/)];
				el.classList.add(...added);
				el.addEventListener('animationend', () => el.classList.remove(...added), { once: true });
			},
		});
	},
}
