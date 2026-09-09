import { describe, expect, it } from 'vitest'
import { validateComposeYAML } from './composeValidation'

// A hand-assembled stack: the project name is nobody's service key, and the main
// service is designated by x-casaos.main. This is the shape the editor used to
// refuse outright.
const vpnStack = `name: media-stack
services:
  gluetun:
    image: qmcgaw/gluetun:latest
  qbittorrent:
    image: linuxserver/qbittorrent:latest
    network_mode: service:gluetun
x-casaos:
  main: qbittorrent
`

describe('validateComposeYAML', () => {
	it('accepts a multi-service stack whose name matches no service', () => {
		expect(validateComposeYAML(vpnStack, 'media-stack').ok).toBe(true)
	})

	it('accepts the common case where the name is also the only service', () => {
		const yaml = 'name: jellyfin\nservices:\n  jellyfin:\n    image: jellyfin/jellyfin:latest\n'
		expect(validateComposeYAML(yaml, 'jellyfin').ok).toBe(true)
	})

	it('rejects empty input', () => {
		expect(validateComposeYAML('   ', 'jellyfin')).toMatchObject({ ok: false, code: 'empty' })
	})

	it('reports malformed YAML instead of throwing', () => {
		expect(validateComposeYAML('name: [unclosed', 'jellyfin')).toMatchObject({ ok: false, code: 'syntax' })
	})

	it('rejects a scalar document', () => {
		expect(validateComposeYAML('just a string', 'jellyfin')).toMatchObject({ ok: false, code: 'not-a-mapping' })
	})

	it('rejects a document declaring no services', () => {
		expect(validateComposeYAML('name: jellyfin\n', 'jellyfin')).toMatchObject({ ok: false, code: 'no-services' })
	})

	it('rejects an empty services mapping', () => {
		expect(validateComposeYAML('name: jellyfin\nservices: {}\n', 'jellyfin')).toMatchObject({ ok: false, code: 'no-services' })
	})

	// The server answers a renamed file with the bare "compose app not match";
	// these two are the only name rule it actually has.
	it('rejects a name that no longer matches the installed app', () => {
		expect(validateComposeYAML(vpnStack, 'other-stack')).toMatchObject({ ok: false, code: 'name-changed' })
	})

	it('rejects a file with no top-level name at all', () => {
		const yaml = 'services:\n  jellyfin:\n    image: x\n'
		expect(validateComposeYAML(yaml, 'jellyfin')).toMatchObject({ ok: false, code: 'name-changed' })
	})
})
