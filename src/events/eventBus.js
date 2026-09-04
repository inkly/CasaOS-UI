import mitt from 'mitt'

/**
 * `new Vue()` used as an event bus is a Vue 2 idiom with no Vue 3 equivalent.
 * mitt matches the semantics the call sites rely on: `emit` carries at most one
 * payload, `off(type)` clears every handler for that type, and
 * `off(type, handler)` removes that exact reference and no other.
 */
export default function createEventBus() {
  const emitter = mitt()
  return { $on: emitter.on, $off: emitter.off, $emit: emitter.emit }
}
