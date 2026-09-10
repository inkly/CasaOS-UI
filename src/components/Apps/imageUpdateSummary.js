/**
 * What to tell the user after an image-update check, as a list of toasts.
 *
 * This lives apart from the component so it can be tested without mounting the
 * apps page: the wording has to hold for one app as well as for twenty, and an
 * answer the dashboard cannot make sense of must never be reported as good news.
 *
 * @param {object} data the `data` of the check response: `{updatable: string[], unchecked: {}}`
 * @returns {{message: string, params?: object, type: string}[]} toasts, in order
 */
// How many apps to name before falling back to a count for the rest.
const MAX_NAMED = 3

export function imageUpdateSummary(data) {
	const updatable = data?.updatable
	const unchecked = data?.unchecked

	// A body that is not the shape we asked for tells us nothing, and "nothing" is
	// not "everything is current" -- claiming the reassuring one is exactly how a
	// host stops being told about updates.
	if (!Array.isArray(updatable) || typeof unchecked !== 'object' || unchecked === null) {
		return [{ message: 'The check did not come back with an answer.', type: 'is-warning' }]
	}

	const toasts = [{
		message: updatable.length > 0
			? 'Apps with a newer image: {count}'
			: 'Every app is running the newest image.',
		params: updatable.length > 0 ? { count: updatable.length } : undefined,
		type: 'is-success',
	}]

	const uncheckedNames = Object.keys(unchecked).sort()
	if (uncheckedNames.length > 0) {
		// Deliberately its own, louder message: an app nobody could get an answer for
		// is not an app known to be up to date, and folding the two together loses
		// the only part the user can act on.
		//
		// And it names them, with what the backend said about each. A count alone is
		// something to worry about and nothing to do: which app, and whether it was a
		// registry that would not answer or an image nobody can resolve, is the whole
		// of what the reader can act on. Three at a time, so one unreachable registry
		// behind twenty apps does not fill the screen.
		const shown = uncheckedNames.slice(0, MAX_NAMED)
		const detail = shown.map(name => `${name}: ${unchecked[name]}`).join(' / ')
		const rest = uncheckedNames.length - shown.length

		toasts.push({
			message: rest > 0
				? 'Could not check {detail}, and {rest} more. They keep their previous state.'
				: 'Could not check {detail}. They keep their previous state.',
			params: { detail, rest },
			type: 'is-warning',
			// long enough to read a reason, where the others are an acknowledgement
			duration: 15000,
		})
	}

	return toasts
}
