<!--
	The wiring every converted form repeats, on its own: a <VeeField> fed by
	:model-value, wrapped around a control that keeps its own v-model, reading
	`errors` and `meta.valid` out of the slot. Kept in an SFC because the app
	runs the runtime-only Vue build, which cannot compile an inline template; a
	plain <input> stands in for the Buefy control, which cannot be mounted for
	real in this suite (its CJS dist pulls in a second Vue runtime).
-->
<template>
	<VeeForm ref="ob" as="span">
		<VeeField v-slot="{ errors, meta }" :model-value="password" name="password" rules="required|min:5">
			<p :class="{ 'is-danger': errors[0], 'is-success': meta.valid }">{{ errors[0] }}</p>
			<input v-model="password">
		</VeeField>
		<VeeField :model-value="confirmation" name="confirmation" rules="required|confirmed:@password" />
		<VeeField :model-value="port" name="port" rules="yaml_port" />
		<VeeField :model-value="containerName" name="containerName" rules="ContainerName" />
	</VeeForm>
</template>

<script>
import { Field as VeeField, Form as VeeForm } from 'vee-validate';

export default {
	name: 'vee-validate-fixture',
	components: {
		VeeField,
		VeeForm
	},
	data() {
		return {
			password: '',
			confirmation: '',
			port: '',
			containerName: ''
		}
	},
	methods: {
		validate() {
			return this.$refs.ob.validate()
		}
	},
}
</script>
