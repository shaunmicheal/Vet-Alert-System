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

// Zimbabwe provinces. Mirrors backend/src/utils/constants.js PROVINCES exactly -
// the backend zod enum is the source of truth, this copy is display/validation only.
export const PROVINCES = Object.freeze([
  'Harare',
  'Bulawayo',
  'Manicaland',
  'Mashonaland Central',
  'Mashonaland East',
  'Mashonaland West',
  'Masvingo',
  'Matabeleland North',
  'Matabeleland South',
  'Midlands',
])

// Display labels for backend enum values (UI metadata only).
export const ANIMAL_TYPE_LABELS = Object.freeze({
  CATTLE: 'Cattle',
  GOATS: 'Goats',
  SHEEP: 'Sheep',
  PIGS: 'Pigs',
  POULTRY: 'Poultry',
})

export const REPORT_STATUS_LABELS = Object.freeze({
  PENDING: 'Pending',
  REVIEWED: 'Reviewed',
  REFERRED: 'Referred',
  RESOLVED: 'Resolved',
})