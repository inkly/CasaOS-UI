// @vitest-environment happy-dom
import Buefy from 'buefy'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import dropdownAppendToBody from './dropdown-append-to-body'

const Host = {
	template: `<b-dropdown append-to-body class="app-card-drop other">
		<template #trigger><button>menu</button></template>
		<b-dropdown-item>Open</b-dropdown-item>
	</b-dropdown>`,
}

it('keeps the dropdown\'s own classes on the menu Buefy moves under <body>', async () => {
	const wrapper = mount(Host, { attachTo: document.body, global: { plugins: [Buefy, dropdownAppendToBody] } })
	const menu = () => document.body.querySelector('.app-card-drop.other .dropdown-menu')
	expect(menu()).not.toBeNull()

	// Buefy rebuilds the wrapper's class list again on every open.
	wrapper.findComponent({ name: 'BDropdown' }).vm.isActive = true
	await nextTick()
	await nextTick()
	expect(menu()).not.toBeNull()
	expect(menu().closest('.dropdown').classList.contains('is-active')).toBe(true)
	wrapper.unmount()
})
