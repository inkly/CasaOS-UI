import { describe, expect, it } from 'vitest'
import { shareLink } from './share'

// The URLs vue-social-sharing built for the two modals that used it, pinned so
// a share button cannot quietly start pointing somewhere else.
const content = {
	url: 'https://github.com/ReCasaOS/CasaOS',
	title: 'I\'m using CasaOS',
	description: 'I\'m using CasaOS',
	hashtags: 'homecloud,opensource',
}

describe('shareLink', () => {
	it('builds the Facebook url with only the first hashtag', () => {
		expect(shareLink('facebook', content)).toBe(
			'https://www.facebook.com/sharer/sharer.php'
			+ '?u=https%3A%2F%2Fgithub.com%2FReCasaOS%2FCasaOS'
			+ '&title=I\'m%20using%20CasaOS'
			+ '&description=I\'m%20using%20CasaOS'
			+ '&quote=&hashtag=%23homecloud',
		)
	})

	it('builds the Twitter url with the raw hashtag list', () => {
		expect(shareLink('twitter', content)).toBe(
			'https://twitter.com/intent/tweet'
			+ '?text=I\'m%20using%20CasaOS'
			+ '&url=https%3A%2F%2Fgithub.com%2FReCasaOS%2FCasaOS'
			+ '&hashtags=homecloud,opensource',
		)
	})

	it('builds the Reddit url, which takes no hashtags', () => {
		expect(shareLink('reddit', content)).toBe(
			'https://www.reddit.com/submit'
			+ '?url=https%3A%2F%2Fgithub.com%2FReCasaOS%2FCasaOS'
			+ '&title=I\'m%20using%20CasaOS',
		)
	})

	it('leaves the hashtag parameters empty when there are none', () => {
		expect(shareLink('facebook', { url: 'x', title: 'y' })).toContain('&hashtag=')
		expect(shareLink('twitter', { url: 'x', title: 'y' })).not.toContain('hashtags')
	})
})
