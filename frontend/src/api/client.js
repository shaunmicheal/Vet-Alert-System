import axios from 'axios'
import { SESSION_EXPIRED_EVENT } from '../utils/constants'
import { getStoredToken } from '../utils/storage'

// Single source of truth for the API location. Only VITE_API_URL is exposed to
// the browser - never backend secrets (Gemini keys, JWT secrets, database URLs).
const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach the JWT when we have one.
api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// A 401 outside of the credential endpoints means the session is no longer
// valid - tell the auth provider so it can sign the user out cleanly.
const CREDENTIAL_ENDPOINTS = ['/auth/login', '/auth/register']

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error && error.response ? error.response.status : null
    const requestPath = (error && error.config && error.config.url) || ''
    const isCredentialRequest = CREDENTIAL_ENDPOINTS.some((endpoint) =>
      requestPath.includes(endpoint),
    )

    if (status === 401 && !isCredentialRequest && typeof window !== 'undefined') {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }

    return Promise.reject(error)
  },
)

export default api