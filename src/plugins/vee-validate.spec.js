// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Fixture from '@/plugins/vee-validate.fixture.vue'
import '@/plugins/vee-validate'

/**
 * The wiring every converted form repeats. None of it is checked by the
 * compiler and all three of its failure modes are quiet: a field that never
 * sees a value reports valid, `confirmed:password` written without the `@` is
 * invalid forever behind a plausible message, and a rule that stopped skipping
 * empty values reddens an untouched form. So mount it for real, no stubs.
 */

async function validate(wrapper) {
	await wrapper.vm.$nextTick()
	return wrapper.vm.validate()
}

describe('vee-validate wiring', () => {
	it('feeds the field from :model-value, not from the child v-model', async () => {
		const wrapper = mount(Fixture)
		expect((await validate(wrapper)).results.password).toMatchObject({
			valid: false,
			errors: ['This field is required'],
		})

		// The control still owns the state; the Field only reads it.
		await wrapper.find('input').setValue('four')
		expect(wrapper.vm.password).toBe('four')
		expect((await validate(wrapper)).results.password).toMatchObject({
			valid: false,
			errors: ['This field must have more than 5 characters'],
		})

		await wrapper.find('input').setValue('secret1')
		expect((await validate(wrapper)).results.password.valid).toBe(true)
		wrapper.unmount()
	})

	it('resolves confirmed against the other field, not the literal name', async () => {
		const wrapper = mount(Fixture)
		wrapper.vm.password = 'secret1'
		wrapper.vm.confirmation = 'typo'
		expect((await validate(wrapper)).results.confirmation).toMatchObject({
			valid: false,
			errors: ['This field confirmation does not match'],
		})

		wrapper.vm.confirmation = 'secret1'
		expect((await validate(wrapper)).results.confirmation.valid).toBe(true)
		wrapper.unmount()
	})

	it('skips the optional rules on an empty value, as vee-validate 3 did', async () => {
		const wrapper = mount(Fixture)
		const empty = await validate(wrapper)
		expect(empty.results.port.valid).toBe(true)
		expect(empty.results.containerName.valid).toBe(true)

		wrapper.vm.port = 'nope'
		wrapper.vm.containerName = 'bad name!'
		const filled = await validate(wrapper)
		expect(filled.results.port.errors).toEqual(['The field mast be a valid docker-compose port'])
		expect(filled.results.containerName.errors[0]).toMatch(/^Name must be a string of numbers/)
		wrapper.unmount()
	})
})
