// Replaces vue-breakpoint-mixin, which is Vue 2 only. Same three breakpoints it
// derived from window.innerWidth: mobile under 768, tablet 768-1023, desktop
// 1024 and up. matchMedia needs no resize handler and no Vue-version-specific
// API, so this mixin survives the Vue 3 swap as it is.
const QUERIES = {
	isMobile: '(max-width: 767.98px)',
	isTablet: '(min-width: 768px) and (max-width: 1023.98px)',
	isDesktop: '(min-width: 1024px)',
}

export default {
	data() {
		return {
			isMobile: false,
			isTablet: false,
			isDesktop: false,
		}
	},

	created() {
		this.breakpointWatchers = Object.keys(QUERIES).map((name) => {
			const query = window.matchMedia(QUERIES[name])
			const onChange = () => {
				this[name] = query.matches
			}
			onChange()
			query.addEventListener('change', onChange)
			return { query, onChange }
		})
	},

	beforeUnmount() {
		this.breakpointWatchers.forEach(({ query, onChange }) => {
			query.removeEventListener('change', onChange)
		})
	},
}
