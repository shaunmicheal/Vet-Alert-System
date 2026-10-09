import axios from 'axios'
import { SESSION_EXPIRED_EVENT } from '../utils/constants'
import { getStoredToken } from '../utils/storage'

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

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

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
