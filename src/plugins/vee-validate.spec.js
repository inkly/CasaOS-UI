// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { validate as validateValue } from 'vee-validate'
import { describe, expect, it, vi } from 'vitest'
import Fixture from '@/plugins/vee-validate.fixture.vue'
import '@/plugins/vee-validate'

// The plugin translates its messages through i18n, whose locale table is built
// with require.context; an empty table makes t() hand back its key.
vi.mock('@/assets/lang', () => ({ default: { en_us: {} } }))

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

	// ComposeConfig collects one form per service with `this.$refs[key][0]`.
	// Vue 3.5 still wraps a ref declared inside v-for in an array, so dropping
	// that [0] - as the migration notes suggested - would make every install and
	// every update die on `validate is not a function`.
	it('still arrays a ref declared inside v-for', () => {
		const wrapper = mount(Fixture)
		const forms = wrapper.vm.validateRow(1)
		expect(Array.isArray(forms)).toBe(true)
		expect(typeof forms[0].validate).toBe('function')
		wrapper.unmount()
	})
})

// The port rule has been carried between two validation APIs, and both times
// the escapes in its pattern were at risk. A rule that rejects every port
// looks exactly like one that works, until somebody types a port. Pin both
// halves, so a collapsed \d fails here rather than in the install dialog.
describe('yaml_port', () => {
	const accepted = ['8080', '80-8080', '192.168.1.1:8080', '192.168.1.1:8080-8090', '192.168.1.1', '65535']
	const rejected = ['nope', 'dddd', 'ddddd-ddddd', 'abc123']

	it.each(accepted)('accepts %s', async (value) => {
		expect((await validateValue(value, 'yaml_port')).valid).toBe(true)
	})

	it.each(rejected)('rejects %s', async (value) => {
		expect((await validateValue(value, 'yaml_port')).valid).toBe(false)
	})
})
