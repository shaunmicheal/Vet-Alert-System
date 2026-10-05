// Tiny wrapper around localStorage for the auth session.
// We only ever store the JWT and the public user profile - never passwords.
const AUTH_STORAGE_KEY = 'vetalert.auth'

export const readStoredAuth = () => {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.token !== 'string' || !parsed.token) return null
    if (!parsed.user || typeof parsed.user !== 'object') return null

    return { token: parsed.token, user: parsed.user }
  } catch {
    // Corrupted JSON or storage unavailable - treat as signed out.
    return null
  }
}

export const writeStoredAuth = ({ token, user }) => {
  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user }))
  } catch {
    // Storage may be full or blocked - the app still works for this visit.
  }
}

export const clearStoredAuth = () => {
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}

export const getStoredToken = () => {
  const stored = readStoredAuth()
  return stored ? stored.token : null
}