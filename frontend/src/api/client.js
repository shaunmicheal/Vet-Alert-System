import axios from 'axios'
import { SESSION_EXPIRED_EVENT } from '../utils/constants'
import { getStoredToken } from '../utils/storage'

// Single source of truth for the API location. Only VITE_API_URL is exposed to
// the browser - never backend secrets (Gemini keys, JWT secrets, database URLs).
//
// The backend mounts every router under /api (see backend/src/app.js), so the
// base URL is normalised to end with /api. VITE_API_URL may therefore be set to
// the origin (http://localhost:5000) or already include the suffix
// (http://localhost:5000/api) - both resolve to the same correct base URL.
const API_BASE_PATH = '/api'
const configuredBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(
  /\/+$/,
  '',
)
const baseURL = configuredBaseUrl.endsWith(API_BASE_PATH)
  ? configuredBaseUrl
  : `${configuredBaseUrl}${API_BASE_PATH}`

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