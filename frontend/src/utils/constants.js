// Shared frontend constants. The backend remains the source of truth for roles.
export const ROLES = Object.freeze({
  FARMER: 'FARMER',
  VETERINARY_PROFESSIONAL: 'VETERINARY_PROFESSIONAL',
  ADMIN: 'ADMIN',
})

// Where each role lands after signing in (and when visiting "/").
export const ROLE_HOME = Object.freeze({
  FARMER: '/farmer',
  VETERINARY_PROFESSIONAL: '/vet',
  ADMIN: '/admin',
})

// Browser event fired by the API client when the API rejects the session (401).
export const SESSION_EXPIRED_EVENT = 'vetalert:session-expired'

export const homePathForRole = (role) => ROLE_HOME[role] || '/unauthorized'