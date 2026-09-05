import smoothReflow from 'vue-smooth-reflow'

// vue-smooth-reflow is a Vue 2 mixin and still declares `destroyed`, which Vue 3
// never calls. The body only drops a transitionend listener from the component's
// own $el - unmount discards that anyway - so nothing leaks, but the option's
// mere presence is a compat deprecation, and it is the last one keeping
// OPTIONS_DESTROYED alive. Rename it here rather than at all five call sites.
const { destroyed, ...rest } = smoothReflow

export default { ...rest, unmounted: destroyed }
