import { parse } from 'yaml'

/**
 * Validate a Docker Compose document before it is sent to AppManagement.
 *
 * Pure on purpose: no Vue, no i18n, no network. It returns a stable `code` that
 * the caller maps to a translated message, so the rules stay testable on their own.
 *
 * @param {string} text raw YAML
 * @returns {{ ok: boolean, code?: string, detail?: string, doc?: object }} the outcome,
 * with `code` naming the broken rule and `doc` the parsed document when valid
 */
export function validateComposeYAML(text) {
  if (typeof text !== 'string' || text.trim() === '')
    return { ok: false, code: 'empty' }

  let doc
  try {
    doc = parse(text)
  }
  catch (error) {
    return { ok: false, code: 'syntax', detail: error.message }
  }

  if (doc === null || typeof doc !== 'object' || Array.isArray(doc))
    return { ok: false, code: 'not-a-mapping' }

  const { services } = doc
  if (services === null || typeof services !== 'object' || Array.isArray(services) || Object.keys(services).length === 0)
    return { ok: false, code: 'no-services' }

  // `hasOwnProperty` rather than `in`: a top-level name of "constructor" or
  // "toString" would otherwise be accepted via the prototype chain.
  if (typeof doc.name !== 'string' || !Object.prototype.hasOwnProperty.call(services, doc.name))
    return { ok: false, code: 'main-service-missing' }

  return { ok: true, doc }
}
