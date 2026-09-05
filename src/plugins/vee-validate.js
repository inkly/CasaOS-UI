/*
 * @LastEditors: zhanghengxin ezreal.zhang@icewhale.org
 * @LastEditTime: 2023/3/31 上午11:35
 * @FilePath: /CasaOS-UI/src/plugins/vee-validate.js
 * @Description:
 *
 * Copyright (c) 2023 by IceWhale, All Rights Reserved.

 */

import { confirmed, min, required } from '@vee-validate/rules';
import { configure, defineRule } from 'vee-validate';
import i18n from '@/plugins/i18n';

// vee-validate 3 skipped a non-required rule when the field was empty
// (`shouldSkip: !isRequired && isEmpty`); v4 runs it. Both optional rules below
// guard for it themselves, or an untouched container name and every freshly
// added port row would go red on first render - and `undefined` reaches
// `value.length`, whose TypeError rejects the whole form's validate().
function isEmpty(value) {
	return value === undefined || value === null || value === '';
}

function isValidContainerName(value) {
	let reg = /^[a-z0-9A-Z\-_]+$/;
	return reg.test(value) && value.length <= 32;
}

defineRule('required', required);
defineRule('confirmed', confirmed);
defineRule('min', min);

defineRule('ContainerName', value => isEmpty(value) || isValidContainerName(value));

defineRule('yaml_port', value => {
	if (isEmpty(value)) {
		return true;
	}

	// Written as one literal rather than assembled from strings: moving this
	// rule between two APIs is exactly how the escapes were lost once already.
	// An IP with an optional port range, or a bare port range.
	const regExp = /^((\d{1,3}\.){3}\d{1,3}(:\d{1,5}(-\d{1,5})?)?)|(^\d{1,5}(-\d{1,5})?)$/
	return regExp.test(value)
});

// true : 满足，成功
// false : 不满足， 报错
// The second argument is still the params array in v4.
defineRule('not_in_ports', (value, params) => params?.[0] === 'false');

// v3 carried the message on every extend(); v4 has one generator per app. The
// forms used to run its output through $t(errors): vue-i18n 8 translated the
// one-element array, vue-i18n 9 throws on it and Vue drops the whole <Field>.
// So the message is translated here and the forms bind `errors` as it comes.
const MESSAGES = {
	required: 'This field is required',
	confirmed: 'This field confirmation does not match',
	ContainerName: 'Name must be a string of numbers, letters, underscores, or hyphens(0~9,a~zA~Z,_,-).',
	yaml_port: 'The field mast be a valid docker-compose port',
	not_in_ports: 'The port is used by other services',
};

configure({
	// v3 interpolated {length} out of the rule's own params; v4 hands them over.
	generateMessage: ctx => i18n.global.t(ctx.rule?.name === 'min'
		? `This field must have more than ${ctx.rule.params?.[0]} characters`
		: MESSAGES[ctx.rule?.name] ?? `${ctx.field} is not valid.`),
});
