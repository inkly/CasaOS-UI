// @vitest-environment happy-dom
import Vue from 'vue'
import Buefy from 'buefy'
import { shallowMount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import StorageManagerPanel from '@/components/Storage/StorageManagerPanel.vue'

// lottie-web paints into a canvas as soon as it is imported and happy-dom has no
// 2d context, so the import itself throws. shallowMount stubs the tag anyway.
vi.mock('lottie-web-vue', () => ({ default: { name: 'lottie-animation', render: h => h('div') } }))

/**
 * `createStorge()` gates on `checkStep(this.$refs.ob1)`, so whatever that guard
 * returns decides whether an invalid form gets submitted. vee-validate 3
 * resolves `validate()` to a Boolean; vee-validate 4 resolves it to
 * `{ valid, ... }`, which is truthy even when `valid` is false. The guard must
 * reduce BOTH shapes to the right Boolean — the failure it prevents is silent.
 */

// Every $api call returns a promise that never settles; the network is not what
// this test is about.
const apiHandler = {
  get: () => new Proxy(() => {}, apiHandler),
  apply: () => new Promise(() => {}),
}
const $api = new Proxy(() => {}, apiHandler)

const mocks = {
  $t: key => key,
  $api,
  $openAPI: $api,
  $EventBus: { $on: () => {}, $off: () => {}, $emit: () => {} },
  $store: { state: { networkStorage: [] }, commit: () => {}, dispatch: () => Promise.resolve() },
}

beforeAll(() => {
  Vue.use(Buefy)
})

describe('storageManagerPanel checkStep', () => {
  const cases = [
    ['vee-validate 3, valid', true, true],
    ['vee-validate 3, invalid', false, false],
    ['vee-validate 4, valid', { valid: true, errors: {} }, true],
    ['vee-validate 4, invalid', { valid: false, errors: { StorageName: 'required' } }, false],
  ]

  it.each(cases)('reduces %s to a Boolean', async (_label, resolved, expected) => {
    const wrapper = shallowMount(StorageManagerPanel, { mocks })
    const answer = await wrapper.vm.checkStep({ validate: () => Promise.resolve(resolved) })
    expect(answer).toBe(expected)
    wrapper.destroy()
  })
})
