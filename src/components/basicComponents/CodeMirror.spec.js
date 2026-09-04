// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CodeMirrorEditor from './CodeMirror.vue'
import ComposeEditor from '@/components/Apps/ComposeEditor.vue'

/**
 * The compose editor is where users type their app's YAML, so the only failures
 * that really matter are a lost keystroke and a stale value. Both directions of
 * the model are pinned here, plus the teardown, since a leaked editor is
 * invisible until the tenth time the panel is reopened.
 */
function editor(value = '', options = {}) {
  const wrapper = mount(CodeMirrorEditor, {
    propsData: { value, options },
    attachTo: document.body,
  })
  return { wrapper, cm: wrapper.vm.codemirror }
}

describe('codeMirror wrapper', () => {
  it('starts on the value it is given, without emitting it back', () => {
    const { wrapper, cm } = editor('a: 1')
    expect(cm.getValue()).toBe('a: 1')
    expect(wrapper.emitted('input')).toBeUndefined()
    expect(wrapper.emitted('ready')[0][0]).toBe(cm)
    wrapper.unmount()
  })

  it('passes the options through to CodeMirror', () => {
    const { wrapper, cm } = editor('', { tabSize: 2, lineNumbers: true })
    expect(cm.getOption('tabSize')).toBe(2)
    expect(cm.getOption('lineNumbers')).toBe(true)
    wrapper.unmount()
  })

  it('emits every edit as input', () => {
    const { wrapper, cm } = editor('a: 1')
    cm.setCursor({ line: 0, ch: 4 })
    cm.replaceSelection('2')
    expect(wrapper.emitted('input').at(-1)[0]).toBe('a: 12')
    wrapper.unmount()
  })

  it('writes a new value in', async () => {
    const { wrapper, cm } = editor('a: 1')
    await wrapper.setProps({ value: 'b: 2' })
    expect(cm.getValue()).toBe('b: 2')
    wrapper.unmount()
  })

  it('leaves the cursor alone when v-model echoes the value back', async () => {
    const { wrapper, cm } = editor('one\ntwo')
    cm.setCursor({ line: 0, ch: 1 })
    // What v-model does after an edit: hand back the value the editor holds.
    await wrapper.setProps({ value: 'one\ntwo' })
    expect(cm.getCursor()).toMatchObject({ line: 0, ch: 1 })
    wrapper.unmount()
  })

  it('gives the textarea back on destroy', () => {
    const { wrapper } = editor('a: 1')
    expect(wrapper.element.querySelector('.CodeMirror')).not.toBeNull()
    wrapper.unmount()
    expect(wrapper.element.querySelector('.CodeMirror')).toBeNull()
    expect(wrapper.element.querySelector('textarea')).not.toBeNull()
  })
})

describe('compose editor over the wrapper', () => {
  // The wrapper's contract is pinned above; this is the one call site where a
  // dropped keystroke costs a user their YAML, so its wiring is exercised for
  // real rather than against a stub.
  function composeEditor(value) {
    return mount(ComposeEditor, {
      propsData: { appId: 'demo', value },
      global: {
        mocks: { $t: key => key, $buefy: { toast: { open: () => {} } }, $openAPI: {} },
        stubs: { 'b-message': true },
      },
      attachTo: document.body,
    })
  }

  it('shows the value it is given and reports no unsaved changes', () => {
    const wrapper = composeEditor('name: demo\n')
    expect(wrapper.findComponent(CodeMirrorEditor).vm.codemirror.getValue()).toBe('name: demo\n')
    expect(wrapper.vm.isDirty).toBe(false)
    wrapper.unmount()
  })

  it('takes an edit made in the editor into the draft', async () => {
    const wrapper = composeEditor('name: demo\n')
    const cm = wrapper.findComponent(CodeMirrorEditor).vm.codemirror
    cm.setCursor({ line: 1, ch: 0 })
    cm.replaceSelection('services:\n')
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.draft).toBe('name: demo\nservices:\n')
    expect(wrapper.vm.isDirty).toBe(true)
    wrapper.unmount()
  })

  it('drops the draft into the editor when the panel reloads the app', async () => {
    const wrapper = composeEditor('name: demo\n')
    const cm = wrapper.findComponent(CodeMirrorEditor).vm.codemirror
    cm.replaceSelection('junk')
    await wrapper.setProps({ value: 'name: reloaded\n' })
    expect(cm.getValue()).toBe('name: reloaded\n')
    expect(wrapper.vm.isDirty).toBe(false)
    wrapper.unmount()
  })
})
