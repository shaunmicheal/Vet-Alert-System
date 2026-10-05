import { useCallback, useEffect, useMemo, useState } from 'react'
import { getMeRequest, loginRequest, registerRequest } from '../api/auth'
import { SESSION_EXPIRED_EVENT } from '../utils/constants'
import { clearStoredAuth, readStoredAuth, writeStoredAuth } from '../utils/storage'
import { AuthContext } from './AuthContext'

// Central authentication state for the whole app.
// - Restores the session on first load (GET /auth/me)
// - login / register against the real backend endpoints
// - logout + forced sign-out when the API reports an expired session
export function AuthProvider({ children }) {
  // Lazy-read any stored session once during the first render so the initial
  // loading state is already correct (no synchronous setState in effects).
  const [storedSession] = useState(() => readStoredAuth())
  const [user, setUser] = useState(() => (storedSession ? storedSession.user : null))
  const [token, setToken] = useState(storedSession ? storedSession.token : null)
  const [loading, setLoading] = useState(Boolean(storedSession))
  const [sessionExpired, setSessionExpired] = useState(false)

  // Verify the restored session against the backend (GET /auth/me).
  useEffect(() => {
    if (!storedSession) return undefined

    let active = true

    getMeRequest()
      .then((data) => {
        if (active) setUser(data.user)
      })
      .catch((error) => {
        if (!active) return
        const status = error && error.response ? error.response.status : null
        // 401/403/404 = the session is genuinely gone. For network or server
        // errors we keep the token so a reload can retry instead of signing out.
        if (status === 401 || status === 403 || status === 404) {
          clearStoredAuth()
          setToken(null)
          setUser(null)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [storedSession])

  // The API client dispatches this event on any 401 outside login/register.
  useEffect(() => {
    const handleSessionExpired = () => {
      clearStoredAuth()
      setToken(null)
      setUser(null)
      setSessionExpired(true)
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
  }, [])

  const login = useCallback(async (credentials) => {
    const data = await loginRequest(credentials)
    writeStoredAuth(data)
    setToken(data.token)
    setUser(data.user)
    setSessionExpired(false)
    return data.user
  }, [])

  const register = useCallback(async (payload) => {
    const data = await registerRequest(payload)
    writeStoredAuth(data)
    setToken(data.token)
    setUser(data.user)
    setSessionExpired(false)
    return data.user
  }, [])

  const logout = useCallback(() => {
    clearStoredAuth()
    setToken(null)
    setUser(null)
    setSessionExpired(false)
  }, [])

  const clearSessionExpired = useCallback(() => setSessionExpired(false), [])

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      sessionExpired,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      clearSessionExpired,
    }),
    [user, token, loading, sessionExpired, login, register, logout, clearSessionExpired],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}