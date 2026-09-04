import mitt from 'mitt'

/**
 * `new Vue()` used as an event bus is a Vue 2 idiom with no Vue 3 equivalent.
 * mitt matches the semantics the call sites rely on: `emit` carries at most one
 * payload, `off(type)` clears every handler for that type, and
 * `off(type, handler)` removes that exact reference and no other.
 */
export default function createEventBus() {
  const emitter = mitt()

  // Vue wrapped every subscriber in its own error handler, so one throwing
  // listener never stopped the others. mitt does not, and these events drive
  // whole panels, so keep the isolation rather than inherit a silent
  // cross-panel failure. Iterating a copy also makes a handler that
  // unsubscribes itself safe.
  const emit = (type, payload) => {
    for (const handler of [...(emitter.all.get(type) || [])]) {
      try {
        handler(payload)
      }
      catch (error) {
        console.error(`[EventBus] handler for "${type}" threw`, error)
      }
    }
  }

  return { $on: emitter.on, $off: emitter.off, $emit: emit }
}
