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


// Import Styles
import '@/assets/scss/app.scss'
import VAnimateCss from '@/plugins/animate-css';

// The @vue/compat scaffold. MODE 2 keeps the Vue-2 idioms this app still
// carries (.native, .sync, $set/$delete, beforeDestroy, functional and async
// components, the old transition class names) working while they are migrated.
//
// Two flags must be OFF, both because their Vue-2 behaviour breaks Buefy 3.1,
// which is already a Vue 3 library:
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
