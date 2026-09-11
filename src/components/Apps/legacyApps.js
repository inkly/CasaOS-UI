/**
 * Sorting out what the dashboard used to show under one heading.
 *
 * "Legacy app (To be rebuilt)" covered three populations that have nothing in
 * common but being outside the compose list, and the heading was a wrong
 * instruction for two of them: a container Portainer started is managed, and one
 * somebody ran by hand is not an app and has nothing to rebuild.
 *
 * The backend already tells them apart -- `app_type`, `compose_project` and
 * `is_uncontrolled` are all on the grid item. This only has to read them.
 */

/**
 * @param {object[]} items the grid items the compose list did not claim
 * @returns {{rebuild: object[], managedElsewhere: object[], loose: object[]}}
 */
export function groupLegacyApps(items) {
	const groups = { rebuild: [], managedElsewhere: [], loose: [] }

	for (const item of items || []) {
		// An app an older CasaOS installed. This is the only group the old heading
		// was ever right about: it really was an app here, and it really does have
		// to be made again.
		if (item.app_type === 'v1app') {
			groups.rebuild.push(item)
			continue
		}

		// A container carrying a compose project label that the compose list did not
		// claim -- a Portainer or Dockge stack whose config file this host cannot
		// read. It is managed, just not from here, and telling somebody to rebuild it
		// invites them to make a second copy of something that is already running.
		if (item.compose_project) {
			groups.managedElsewhere.push(item)
			continue
		}

		groups.loose.push(item)
	}

	return groups
}

/**
 * What a card can say about a container whose name Docker invented.
 *
 * `adoring_antonelli` identifies nothing. The image is the one line that says
 * what it actually is, the published port is how somebody reaches it, and the age
 * separates something started last week from something left behind two years ago.
 *
 * @param {object} item a grid item
 * @param {(seconds: number) => string} ago turns a unix time into words
 * @returns {string[]} the facts worth showing, in order, omitting what is unknown
 */
export function containerFacts(item, ago) {
	const facts = []

	if (item.image)
		facts.push(item.image)

	if (item.port)
		facts.push(`:${item.port}`)

	// Created is a number and zero is a real answer from the API -- meaning the
	// daemon gave no date -- so it is checked for truthiness rather than presence.
	if (item.created)
		facts.push(ago(item.created))

	return facts
}

/**
 * How long ago, in words, from a unix time in seconds.
 *
 * Rough on purpose. Nobody deciding whether to delete a stray container needs the
 * minute; they need to know whether it is from this week or from before they had
 * this box.
 *
 * @param {number} seconds unix time
 * @param {number} [nowMs] the current time in ms, passed in so this can be tested
 * @returns {string} an i18n key with a {n}, or '' when the date makes no sense
 */
export function ageKey(seconds, nowMs) {
	const now = nowMs === undefined ? Date.now() : nowMs
	const days = Math.floor((now - seconds * 1000) / 86400000)

	// A container created in the future is a clock that disagrees, not an age.
	if (!Number.isFinite(days) || days < 0)
		return ''

	if (days < 1)
		return 'today'
	if (days < 30)
		return `${days}d`
	if (days < 365)
		return `${Math.floor(days / 30)}mo`

	return `${Math.floor(days / 365)}y`
}
