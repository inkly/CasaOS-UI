/**
 * Replaces vue-social-sharing, which has no stable Vue 3 release.
 *
 * Only the three networks CasaOS offers, building the same URLs the library
 * built and opening the same 626x436 popup, centred the same way. The
 * open/close/change events it emitted had no listener here.
 */
const NETWORKS = {
	facebook: ({ url, title, description, hashtags }) =>
		`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}&title=${enc(title)}&description=${enc(description)}&quote=&hashtag=${hashtags ? `%23${hashtags.split(',')[0]}` : ''}`,
	twitter: ({ url, title, hashtags }) =>
		`https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}${hashtags ? `&hashtags=${hashtags}` : ''}`,
	reddit: ({ url, title }) =>
		`https://www.reddit.com/submit?url=${enc(url)}&title=${enc(title)}`,
}

function enc(value) {
	return encodeURIComponent(value || '')
}

export function shareLink(network, content) {
	return NETWORKS[network](content)
}

export default function shareTo(network, content) {
	const width = 626
	const height = 436
	// Centre on the screen the browser window is actually on, zoom included.
	const zoom = window.innerWidth / window.screen.availWidth
	const left = (window.innerWidth - width) / 2 / zoom + window.screenLeft
	const top = (window.innerHeight - height) / 2 / zoom + window.screenTop

	const popup = window.open(
		shareLink(network, content),
		`sharer-${network}`,
		`height=${height},width=${width},left=${left},top=${top},screenX=${left},screenY=${top}`,
	)

	if (popup) {
		popup.focus()
	}
}
