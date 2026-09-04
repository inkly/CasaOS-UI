/**
 * Stand-in for `vue-socket.io-extended` (upstream archived, no Vue 3 successor).
 *
 * It keeps the only two pieces of that plugin this app ever used: the
 * `sockets: { … }` component option, and the `$socket.$subscribe /
 * $unsubscribe` pair. Handlers are attached in `created` and detached in
 * `beforeUnmount`, as the library did.
 *
 * `$socket` lives on `globalProperties` rather than on each instance, because
 * AppStoreSourceManagement.vue reads it from `setup()` and Vue 3 runs `setup()`
 * *before* every mixin hook — there is no hook left that could install it in
 * time. The per-component handler list moved to a WeakMap to match.
 *
 * Not reimplemented, because nothing here reads them: `$socket.connected`,
 * `$socket.disconnected`, `$socket.client`, and the automatic Vuex
 * mutation/action dispatch (main.js never passed a store).
 */
import { getCurrentInstance } from 'vue'

export default {
	install(app, socket) {
		// Vue 3 does not expose its built-in merge strategies on app.config, so
		// spell out the methods-like merge the library relied on: a mixin and a
		// component can both contribute handlers.
		app.config.optionMergeStrategies.sockets = (to, from) => (to ? { ...from, ...to } : from)

		const handlers = new WeakMap()
		const listOf = (vm) => {
			let list = handlers.get(vm)
			if (!list) handlers.set(vm, (list = []))
			return list
		}
		// Set while a lifecycle hook runs, which is when the detached
		// `const subscribe = app.$socket.$subscribe` call sites use it.
		const caller = () => getCurrentInstance()?.proxy

		const subscribe = (vm, event, handler) => {
			const listener = vm ? handler.bind(vm) : handler
			if (vm) listOf(vm).push([event, listener])
			socket.on(event, listener)
		}

		const unsubscribe = (vm, event) => {
			if (!vm) return
			const kept = []
			for (const entry of listOf(vm)) {
				if (entry[0] === event) socket.off(entry[0], entry[1])
				else kept.push(entry)
			}
			handlers.set(vm, kept)
		}

		app.config.globalProperties.$socket = {
			$subscribe: (event, handler) => subscribe(caller(), event, handler),
			$unsubscribe: (event) => unsubscribe(caller(), event)
		}

		app.mixin({
			created() {
				// `this`, not caller(): getCurrentInstance() is not set while the
				// options-API hooks run.
				const declared = this.$options.sockets
				if (declared) {
					Object.keys(declared).forEach(event => subscribe(this, event, declared[event]))
				}
			},

			beforeUnmount() {
				for (const [event, listener] of listOf(this)) socket.off(event, listener)
				handlers.set(this, [])
			}
		})
	}
}
