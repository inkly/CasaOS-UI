export const THEME_KEY = 'theme'
export const THEMES = ['light', 'dark', 'system']
const DARK_QUERY = '(prefers-color-scheme: dark)'

// The preference lives in localStorage rather than in the user's server-side
// settings: /login and /welcome render before any user exists, and the theme
// has to be known before the first paint. The same three rules are inlined in
// public/index.html for that first paint; keep them in step.
function environment(env) {
  return {
    storage: env?.storage ?? (typeof localStorage === 'undefined' ? null : localStorage),
    matchMedia: env?.matchMedia ?? (typeof matchMedia === 'undefined' ? null : query => matchMedia(query)),
    root: env?.root ?? (typeof document === 'undefined' ? null : document.documentElement),
  }
}

/**
 * The stored preference: 'light' | 'dark' | 'system'. Anything unreadable or
 * unknown counts as 'system'.
 */
export function readThemePreference(storage) {
  const { storage: store } = environment({ storage })

  try {
    const value = store && store.getItem(THEME_KEY)
    return THEMES.includes(value) ? value : 'system'
  }
  catch {
    return 'system'
  }
}

/** Collapse a preference to what goes on the attribute: only 'light' | 'dark'. */
export function resolveTheme(preference, matchMedia) {
  if (preference === 'light' || preference === 'dark') {
    return preference
  }

  try {
    return matchMedia && matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
  }
  catch {
    return 'light'
  }
}

// ponytail: one module-level subscription; the app has one document.
let unsubscribe = null

/**
 * Stamp data-theme on the root and follow the OS only while the preference is
 * 'system'. Re-applying replaces the previous subscription. Never throws.
 */
export function applyThemePreference(preference, env) {
  const { matchMedia, root } = environment(env)
  const stamp = () => {
    if (root) {
      root.dataset.theme = resolveTheme(preference, matchMedia)
    }
  }

  stamp()

  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }

  if (preference !== 'system') {
    return
  }

  try {
    const query = matchMedia && matchMedia(DARK_QUERY)
    if (!query || typeof query.addEventListener !== 'function') {
      return
    }
    query.addEventListener('change', stamp)
    unsubscribe = () => query.removeEventListener('change', stamp)
  }
  catch {
    // No usable matchMedia: the value stamped above stands for this page load.
  }
}

/** Persist the preference (best effort) and apply it. Unknown values become 'system'. */
export function setThemePreference(preference, env) {
  const value = THEMES.includes(preference) ? preference : 'system'
  const { storage } = environment(env)

  try {
    if (storage) {
      storage.setItem(THEME_KEY, value)
    }
  }
  catch {
    // Blocked storage: the choice still applies for this page load.
  }

  applyThemePreference(value, env)
}
