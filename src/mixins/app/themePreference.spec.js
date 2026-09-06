import { beforeEach, describe, expect, it } from 'vitest'
import {
	applyThemePreference,
	readThemePreference,
	resolveTheme,
	setThemePreference,
} from './themePreference'

function fakeStorage(entries) {
	return {
		getItem: key => (key in entries ? entries[key] : null),
		setItem: (key, value) => {
			entries[key] = value
		},
	}
}

const throwingStorage = {
	getItem: () => {
		throw new Error('blocked')
	},
	setItem: () => {
		throw new Error('blocked')
	},
}

function fakeMatchMedia(matches) {
	const query = {
		matches,
		listeners: [],
		addEventListener(_event, listener) {
			query.listeners.push(listener)
		},
		removeEventListener(_event, listener) {
			query.listeners = query.listeners.filter(entry => entry !== listener)
		},
		fire() {
			query.listeners.forEach(listener => listener())
		},
	}
	return Object.assign(() => query, { query })
}

// applyThemePreference keeps one module-level OS subscription; drop it so a
// case cannot leak its listener into the next one.
beforeEach(() => {
	applyThemePreference('light', { matchMedia: null, root: { dataset: {} } })
})

describe('readThemePreference', () => {
	it('follows the system when nothing is stored', () => {
		expect(readThemePreference(fakeStorage({}))).toBe('system')
	})

	it('reads a stored choice back', () => {
		expect(readThemePreference(fakeStorage({ theme: 'light' }))).toBe('light')
		expect(readThemePreference(fakeStorage({ theme: 'dark' }))).toBe('dark')
		expect(readThemePreference(fakeStorage({ theme: 'system' }))).toBe('system')
	})

	it('treats an unknown value as the system preference', () => {
		expect(readThemePreference(fakeStorage({ theme: 'blue' }))).toBe('system')
		expect(readThemePreference(fakeStorage({ theme: '' }))).toBe('system')
	})

	it('treats blocked storage as the system preference', () => {
		expect(readThemePreference(throwingStorage)).toBe('system')
	})

	it('treats missing storage as the system preference', () => {
		expect(readThemePreference(null)).toBe('system')
	})
})

describe('resolveTheme', () => {
	it('keeps an explicit choice whatever the OS says', () => {
		expect(resolveTheme('light', fakeMatchMedia(true))).toBe('light')
		expect(resolveTheme('dark', fakeMatchMedia(false))).toBe('dark')
	})

	it('resolves the system preference through the OS', () => {
		expect(resolveTheme('system', fakeMatchMedia(true))).toBe('dark')
		expect(resolveTheme('system', fakeMatchMedia(false))).toBe('light')
	})

	it('falls back to light when the OS cannot be asked', () => {
		expect(resolveTheme('system', null)).toBe('light')
		expect(resolveTheme('system', () => {
			throw new Error('no matchMedia')
		})).toBe('light')
	})
})

describe('applyThemePreference', () => {
	it('stamps the resolved theme on the root, never the word system', () => {
		const root = { dataset: {} }

		applyThemePreference('dark', { matchMedia: fakeMatchMedia(false), root })
		expect(root.dataset.theme).toBe('dark')

		applyThemePreference('system', { matchMedia: fakeMatchMedia(true), root })
		expect(root.dataset.theme).toBe('dark')

		applyThemePreference('system', { matchMedia: fakeMatchMedia(false), root })
		expect(root.dataset.theme).toBe('light')
	})

	it('follows the OS while the preference is system', () => {
		const root = { dataset: {} }
		const matchMedia = fakeMatchMedia(false)

		applyThemePreference('system', { matchMedia, root })
		expect(matchMedia.query.listeners).toHaveLength(1)

		matchMedia.query.matches = true
		matchMedia.query.fire()
		expect(root.dataset.theme).toBe('dark')
	})

	it('stops following the OS once a theme is chosen', () => {
		const root = { dataset: {} }
		const matchMedia = fakeMatchMedia(false)

		applyThemePreference('system', { matchMedia, root })
		applyThemePreference('dark', { matchMedia, root })
		expect(matchMedia.query.listeners).toHaveLength(0)

		matchMedia.query.matches = false
		matchMedia.query.fire()
		expect(root.dataset.theme).toBe('dark')
	})

	it('keeps a single OS listener when system is applied twice', () => {
		const matchMedia = fakeMatchMedia(false)
		const root = { dataset: {} }

		applyThemePreference('system', { matchMedia, root })
		applyThemePreference('system', { matchMedia, root })
		expect(matchMedia.query.listeners).toHaveLength(1)
	})

	it('copes with a media query that cannot be listened to', () => {
		const root = { dataset: {} }
		const matchMedia = () => ({ matches: true })

		expect(() => applyThemePreference('system', { matchMedia, root })).not.toThrow()
		expect(root.dataset.theme).toBe('dark')
	})

	it('paints the theme-color meta to match, and follows an OS flip', () => {
		const root = { dataset: {} }
		const meta = { content: '#ffffff' }
		const matchMedia = fakeMatchMedia(true)

		applyThemePreference('system', { matchMedia, root, meta })
		expect(meta.content).toBe('#1f2023')

		matchMedia.query.matches = false
		matchMedia.query.fire()
		expect(meta.content).toBe('#ffffff')
	})

	it('does not throw without a document', () => {
		expect(() => applyThemePreference('dark', { matchMedia: fakeMatchMedia(false), root: null })).not.toThrow()
	})
})

describe('setThemePreference', () => {
	it('persists the choice and applies it', () => {
		const entries = {}
		const root = { dataset: {} }

		setThemePreference('dark', { storage: fakeStorage(entries), matchMedia: fakeMatchMedia(false), root })

		expect(entries.theme).toBe('dark')
		expect(root.dataset.theme).toBe('dark')
	})

	it('still applies the choice when storage is blocked', () => {
		const root = { dataset: {} }

		expect(() => setThemePreference('dark', { storage: throwingStorage, matchMedia: fakeMatchMedia(false), root })).not.toThrow()
		expect(root.dataset.theme).toBe('dark')
	})

	it('stores an unknown value as system and resolves it through the OS', () => {
		const entries = {}
		const root = { dataset: {} }

		setThemePreference('blue', { storage: fakeStorage(entries), matchMedia: fakeMatchMedia(true), root })

		expect(entries.theme).toBe('system')
		expect(root.dataset.theme).toBe('dark')
	})
})
