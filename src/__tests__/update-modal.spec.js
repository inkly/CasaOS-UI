// @vitest-environment happy-dom
import Buefy from 'buefy'
import VueDOMPurifyHTML from 'vue-dompurify-html'
import { config, shallowMount } from '@vue/test-utils'
import { beforeAll, expect, it } from 'vitest'
import UpdateModal from '@/components/settings/UpdateModal.vue'

beforeAll(() => {
  config.global.plugins = [Buefy, VueDOMPurifyHTML]
})

it('shows the upgrade log as text, without the installer colour codes', async () => {
  const wrapper = shallowMount(UpdateModal, {
    props: { changeLog: '# hi' },
    global: { mocks: { $t: key => key, $api: {} } },
  })
  const esc = String.fromCharCode(27)
  await wrapper.setData({
    isUpdating: true,
    updateLogs: `${esc}[90m[${esc}[0m${esc}[38;5;154m INFO ${esc}[0m${esc}[90m]${esc}[0m Downloading...\n[  OK  ] Verified`,
  })
  expect(wrapper.find('pre').text()).toBe('[ INFO ] Downloading...\n[  OK  ] Verified')
})
