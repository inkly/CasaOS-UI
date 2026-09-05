import {configureCompat} from 'vue'

// The runtime half of the @vue/compat scaffold, matching src/main.js. Without
// it the specs would run with COMPONENT_V_MODEL on, which rewrites every
// component v-model back to Vue 2's value/input and breaks Buefy 3.1 - i.e.
// they would exercise a differently broken app than the one that ships.
configureCompat({
	MODE: 2,
	COMPONENT_V_MODEL: false,
	ATTR_FALSE_VALUE: false,
	OPTIONS_BEFORE_DESTROY: false,
	OPTIONS_DESTROYED: false,
	INSTANCE_SET: false,
	INSTANCE_DELETE: false,
	WATCH_ARRAY: false,
})
