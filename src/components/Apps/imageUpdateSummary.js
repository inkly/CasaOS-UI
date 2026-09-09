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

	const uncheckedCount = Object.keys(unchecked).length
	if (uncheckedCount > 0) {
		// Deliberately its own, louder message: an app nobody could get an answer for
		// is not an app known to be up to date, and folding the two together loses
		// the only part the user can act on.
		toasts.push({
			message: 'Apps that could not be checked: {count}. They keep their previous state.',
			params: { count: uncheckedCount },
			type: 'is-warning',
		})
	}

	return toasts
}
