import { describe, expect, it } from 'vitest'
import { validateComposeYAML } from './composeValidation'

const validCompose = `name: jellyfin
services:
  jellyfin:
    image: jellyfin/jellyfin:latest
`

describe('validateComposeYAML', () => {
	it('accepts a compose file whose name matches a declared service', () => {
		expect(validateComposeYAML(validCompose).ok).toBe(true)
	})

	it('rejects empty input', () => {
		expect(validateComposeYAML('   ')).toMatchObject({ ok: false, code: 'empty' })
	})

	it('reports malformed YAML instead of throwing', () => {
		expect(validateComposeYAML('name: [unclosed')).toMatchObject({ ok: false, code: 'syntax' })
	})

	it('rejects a scalar document', () => {
		expect(validateComposeYAML('just a string')).toMatchObject({ ok: false, code: 'not-a-mapping' })
	})

	it('rejects a document declaring no services', () => {
		expect(validateComposeYAML('name: jellyfin\n')).toMatchObject({ ok: false, code: 'no-services' })
	})

	it('rejects an empty services mapping', () => {
		expect(validateComposeYAML('name: jellyfin\nservices: {}\n')).toMatchObject({ ok: false, code: 'no-services' })
	})

	it('rejects a name that matches no service', () => {
		const yaml = 'name: nope\nservices:\n  jellyfin:\n    image: x\n'
		expect(validateComposeYAML(yaml)).toMatchObject({ ok: false, code: 'main-service-missing' })
	})

	it('does not accept inherited Object properties as a service name', () => {
		const yaml = 'name: constructor\nservices:\n  jellyfin:\n    image: x\n'
		expect(validateComposeYAML(yaml)).toMatchObject({ ok: false, code: 'main-service-missing' })
	})
})
