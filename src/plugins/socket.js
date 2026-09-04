/**
 * Stand-in for `vue-socket.io-extended` (upstream archived, no Vue 3 successor).
 *
 * It keeps the only two pieces of that plugin this app ever used: the
 * `sockets: { … }` component option, and the `$socket.$subscribe /
 * $unsubscribe` pair. Timing matches the library exactly — handlers are
 * attached in `created` and detached in `beforeDestroy`.
 *
 * Not reimplemented, because nothing here reads them: `$socket.connected`,
 * `$socket.disconnected`, `$socket.client`, and the automatic Vuex
 * mutation/action dispatch (main.js never passed a store).
 */
export default {
	install(Vue, socket) {
		// As the library did, so a mixin and a component can both contribute handlers.
		Vue.config.optionMergeStrategies.sockets = Vue.config.optionMergeStrategies.methods

		Vue.mixin({
			// Not `created`: AppStoreSourceManagement.vue reads `$socket.$subscribe`
			// from `setup()`, which Vue 2.7 runs before any created hook.
			beforeCreate() {
				this._socketHandlers = []
				this.$socket = {
					$subscribe: (event, handler) => {
						const listener = handler.bind(this)
						this._socketHandlers.push([event, listener])
						socket.on(event, listener)
					},
					$unsubscribe: (event) => {
						const kept = []
						for (const entry of this._socketHandlers) {
							if (entry[0] === event) socket.off(entry[0], entry[1])
							else kept.push(entry)
						}
						this._socketHandlers = kept
					}
				}
			},

			created() {
				const handlers = this.$options.sockets
				if (handlers) {
					Object.keys(handlers).forEach(event => this.$socket.$subscribe(event, handlers[event]))
				}
			},

			beforeDestroy() {
				for (const [event, listener] of this._socketHandlers) socket.off(event, listener)
				this._socketHandlers = []
			}
		})
	}
}
