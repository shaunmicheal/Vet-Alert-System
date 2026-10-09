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
    return null
  }
}

export const writeStoredAuth = ({ token, user }) => {
  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user }))
  } catch {
  }
}

export const clearStoredAuth = () => {
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
  }
}

export const getStoredToken = () => {
  const stored = readStoredAuth()
  return stored ? stored.token : null
}
