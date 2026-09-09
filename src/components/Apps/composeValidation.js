import { parse } from 'yaml'

/**
 * Validate a Docker Compose document before it is sent to AppManagement.
 *
 * Pure on purpose: no Vue, no i18n, no network. It returns a stable `code` that
 * the caller maps to a translated message, so the rules stay testable on their own.
 *
 * The rules mirror what the server will actually accept. In particular the main
 * service is NOT the top-level `name`: AppManagement reads it from `x-casaos.main`
 * and falls back to the alphabetically first service (service/compose_app.go,
 * StoreInfo/MainService), so a hand-assembled stack whose project name matches no
 * service is perfectly valid.
 *
 * @param {string} text raw YAML
 * @param {string} installedName id of the installed app this file belongs to
 * @returns {{ ok: boolean, code?: string, detail?: string, doc?: object }} the outcome,
 * with `code` naming the broken rule and `doc` the parsed document when valid
 */
export function validateComposeYAML(text, installedName) {
	if (typeof text !== 'string' || text.trim() === '')
		return { ok: false, code: 'empty' }

	let doc
	try {
		doc = parse(text)
	} catch (error) {
		return { ok: false, code: 'syntax', detail: error.message }
	}

	if (doc === null || typeof doc !== 'object' || Array.isArray(doc))
		return { ok: false, code: 'not-a-mapping' }

	const { services } = doc
	if (services === null || typeof services !== 'object' || Array.isArray(services) || Object.keys(services).length === 0)
		return { ok: false, code: 'no-services' }

	// The one name rule the server has: apply() compares the top-level `name` of the
	// submitted file with the installed project name and returns the bare string
	// "compose app not match" when they differ. Renaming has to go through a
	// reinstall, so say that here instead of failing the save with that string.
	if (doc.name !== installedName)
		return { ok: false, code: 'name-changed' }

	return { ok: true, doc }
}
