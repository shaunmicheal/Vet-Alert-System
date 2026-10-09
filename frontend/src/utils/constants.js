export const ROLES = Object.freeze({
  FARMER: 'FARMER',
  VETERINARY_PROFESSIONAL: 'VETERINARY_PROFESSIONAL',
  ADMIN: 'ADMIN',
})

export const ROLE_HOME = Object.freeze({
  FARMER: '/farmer',
  VETERINARY_PROFESSIONAL: '/vet',
  ADMIN: '/admin',
})

export const SESSION_EXPIRED_EVENT = 'vetalert:session-expired'

export const homePathForRole = (role) => ROLE_HOME[role] || '/unauthorized'

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

export const ANIMAL_TYPES = Object.freeze(['CATTLE', 'GOATS', 'SHEEP', 'PIGS', 'POULTRY'])

export const ANIMAL_TYPE_LABELS = Object.freeze({
  CATTLE: 'Cattle',
  GOATS: 'Goats',
  SHEEP: 'Sheep',
  PIGS: 'Pigs',
  POULTRY: 'Poultry',
})

export const ANIMAL_SEXES = Object.freeze(['MALE', 'FEMALE'])

export const ANIMAL_SEX_LABELS = Object.freeze({
  MALE: 'Male',
  FEMALE: 'Female',
})

export const REPORT_STATUS_LABELS = Object.freeze({
  PENDING: 'Pending',
  REVIEWED: 'Reviewed',
  REFERRED: 'Referred',
  RESOLVED: 'Resolved',
})

export const RISK_LEVELS = Object.freeze(['LOW', 'MODERATE', 'HIGH'])

export const RISK_LEVEL_LABELS = Object.freeze({
  LOW: 'Low risk',
  MODERATE: 'Moderate risk',
  HIGH: 'High risk',
})

export const FRONTEND_DISCLAIMER =
  'This AI-assisted assessment is not a veterinary diagnosis. For serious, worsening, or high-risk cases, seek professional veterinary assistance.'
