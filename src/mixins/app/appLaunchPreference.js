export const APP_LAUNCH_IFRAME_KEY = 'appLaunchInIframe'
export const APP_LAUNCH_EXCEPTIONS_KEY = 'appLaunchExceptions'

// qBittorrent refuses to render in a frame, so it shipped as a hardcoded
// exception. Seeding the list with it keeps that behaviour for anyone upgrading
// instead of quietly regressing the one app the exception existed for.
export const DEFAULT_APP_LAUNCH_EXCEPTIONS = ['qbittorrent', 'org.icewhale.qbittorrent']

function identifiersOf(appInfo) {
	return [appInfo && appInfo.id, appInfo && appInfo.name]
		.filter(Boolean)
		.map(identifier => String(identifier).toLowerCase())
}

/**
 * Decide whether an app opens in a new browser tab rather than in the in-page
 * dialog.
 *
 * Pure on purpose: no Vuex, no storage, no window. The preference is passed in
 * so the rule can be tested on its own.
 *
 * @param {object} appInfo app being opened, carrying an id and/or a name
 * @param {{inIframe: boolean, exceptions: string[]}} preference current setting
 * @returns {boolean} true when the app should open in a new tab
 */
export function shouldOpenInNewWindow(appInfo, preference) {
	const inIframe = !preference || preference.inIframe !== false

	if (!inIframe) {
		return true
	}

	const exceptions = new Set(
		((preference && preference.exceptions) || []).map(entry => String(entry).toLowerCase()),
	)

	return identifiersOf(appInfo).some(identifier => exceptions.has(identifier))
}

/**
 * Read the stored preference, falling back to the previous behaviour when
 * nothing has been chosen: apps open in the dialog, qBittorrent excepted.
 */
export function readAppLaunchPreference(storage) {
	const store = storage || (typeof localStorage === 'undefined' ? null : localStorage)

	if (!store) {
		return { inIframe: true, exceptions: [...DEFAULT_APP_LAUNCH_EXCEPTIONS] }
	}

	const stored = store.getItem(APP_LAUNCH_IFRAME_KEY)
	let exceptions = [...DEFAULT_APP_LAUNCH_EXCEPTIONS]

	try {
		const raw = store.getItem(APP_LAUNCH_EXCEPTIONS_KEY)
		if (raw) {
			const parsed = JSON.parse(raw)
			if (Array.isArray(parsed)) {
				exceptions = parsed
			}
		}
	} catch {
		// A corrupted entry falls back to the defaults rather than breaking every
		// app launch on the dashboard.
	}

	return { inIframe: stored === null ? true : stored === 'true', exceptions }
}
