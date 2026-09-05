import 'intersection-observer'
import { createApp, configureCompat } from 'vue'
import App from '@/App.vue'
import router from '@/router'
import store from '@/store'
import i18n from '@/plugins/i18n'
import api from '@/service/api.js'
import openAPI from '@/service/index.js'
import Buefy from 'buefy'
import VueFullscreen from 'vue-fullscreen'
import socketPlugin from '@/plugins/socket.js'
import createEventBus from '@/events/eventBus.js'
import messageBus from '@/events/index.js'
import VueDOMPurifyHTML from 'vue-dompurify-html'
// vee-validate 4 throws `No such validator '<name>' exists.` for a rule nobody
// registered, so the rules are defined once here instead of by whichever form
// happens to be imported first. Ports.vue and StorageManagerPanel.vue name
// rules they never registered and only ever worked by that load order.
import '@/plugins/vee-validate'


// Import Styles
import '@/assets/scss/app.scss'
import VAnimateCss from '@/plugins/animate-css';

// The @vue/compat scaffold. MODE 2 keeps the Vue-2 idioms this app still
// carries working while they are migrated; every flag switched off below is one
// that has been paid off, and the goal is a list long enough to delete the
// scaffold. Compiler-side flags (.native, .sync, v-if/v-for precedence) do not
// live here - they go in the vue-loader compatConfig in vue.config.js, because
// this is the runtime-only build. Keep this call in step with vitest.setup.js.
//
// Two flags were off from day one, both because their Vue-2 behaviour breaks
// Buefy 3.1, which is already a Vue 3 library:
//   COMPONENT_V_MODEL rewrites every component `v-model` from
//   `modelValue`/`update:modelValue` back to Vue 2's `value`/`input`, which
//   Buefy does not read - it would silently break all ~110 v-model bindings.
//   ATTR_FALSE_VALUE renders `:attr="false"` as attr="false" instead of
//   dropping the attribute; Buefy passes falsy props down as fallthrough
//   attributes, and `disabled="false"` is truthy in HTML.
configureCompat({
	MODE: 2,
	COMPONENT_V_MODEL: false,
	ATTR_FALSE_VALUE: false,
	// Paid off: $set is a plain write, which Vue 3's proxies track.
	INSTANCE_SET: false,
	// Paid off with vee-validate 3: it was the last holder of all three, and
	// nothing in src/ or in the vendored bundle declares beforeDestroy/destroyed
	// or calls $delete any more.
	OPTIONS_BEFORE_DESTROY: false,
	OPTIONS_DESTROYED: false,
	INSTANCE_DELETE: false,
	// Held on by vee-validate 3, which read this.$listeners in its render. With
	// it on, compat strips every on* key out of $attrs (shouldSkipAttr), so a
	// listener the child does not declare in `emits` is silently dropped instead
	// of falling through to the DOM - which is what removing `.native` in part 2a
	// left the app relying on. Buefy 3 declares narrow `emits`, so `@click` on a
	// <b-icon> or `@keyup.enter` on a <b-input> only works with this off.
	INSTANCE_LISTENERS: false,
	// Paid off: the only array watcher was dead - its writer is commented out.
	WATCH_ARRAY: false,
})

const io = require("socket.io-client");

const isDev = process.env.NODE_ENV === 'dev';
const protocol = document.location.protocol
const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:'
const devIp = process.env.VUE_APP_DEV_IP
const devPort = process.env.VUE_APP_DEV_PORT
const localhost = document.location.host
const localhostName = document.location.hostname
const baseIp = isDev ? `${devIp}` : `${localhostName}`
const baseURL = isDev ? `${devIp}:${devPort}` : `${localhost}`
const wsURL = `${wsProtocol}//${baseURL}`

const socket = io( {
	transports: ['websocket', 'polling'],
	path: '/v2/message_bus/socket.io/',
});

const app = createApp(App)

app.use(Buefy)
app.use(VueFullscreen)
app.use(VAnimateCss);
app.use(socketPlugin, socket);
app.use(VueDOMPurifyHTML, {
	default: {
		ALLOWED_ATTR: ['target', 'href']
	}
});

app.config.globalProperties.$api = api;
app.config.globalProperties.$openAPI = openAPI;
app.config.globalProperties.$baseIp = baseIp;
app.config.globalProperties.$baseURL = baseURL;
app.config.globalProperties.$protocol = protocol;
app.config.globalProperties.$wsProtocol = wsProtocol;


// Create an EventBus
app.config.globalProperties.$EventBus = createEventBus();
app.config.globalProperties.$messageBus = messageBus;

app.use(router)
app.use(store)
app.use(i18n)
app.mount('#app')
