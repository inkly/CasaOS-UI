import {configureCompat} from 'vue'

// The runtime half of the @vue/compat scaffold, matching src/main.js. Without
// it the specs would run with COMPONENT_V_MODEL on, which rewrites every
// component v-model back to Vue 2's value/input and breaks Buefy 3.1 - i.e.
// they would exercise a differently broken app than the one that ships.
configureCompat({
	MODE: 2,
	COMPONENT_V_MODEL: false,
	ATTR_FALSE_VALUE: false,
	INSTANCE_SET: false,
	// See the note in src/main.js: vee-validate no longer holds these three on.
	OPTIONS_BEFORE_DESTROY: true,
	OPTIONS_DESTROYED: true,
	INSTANCE_DELETE: true,
	WATCH_ARRAY: false,
})
