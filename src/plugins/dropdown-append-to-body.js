/**
 * Buefy 0.9 copied a `<b-dropdown>`'s static class onto the menu it moves
 * under `<body>` for `append-to-body`, so `.app-card-drop .dropdown-menu` and
 * `.file-dropdown .dropdown-menu` kept matching. Buefy 3.1 rebuilds that
 * wrapper's class list from its own rootClasses alone, on mount and on every
 * open, and each class-scoped menu style in the tree fell back to Bulma's
 * defaults without a warning: the app card menu came out centred. This puts
 * the classes back after every rebuild.
 */
import { normalizeClass } from 'vue'

export default {
	install(app) {
		app.mixin({
			created() {
				if (this.$options.name !== 'BDropdown' || !this.appendToBody)
					return
				const rebuild = this.updateAppendToBody
				this.updateAppendToBody = () => {
					rebuild()
					const classes = normalizeClass(this.$attrs.class)
					if (classes)
						this.$data._bodyEl.children[0].classList.add(...classes.split(/\s+/))
				}
			},
		})
	},
}
