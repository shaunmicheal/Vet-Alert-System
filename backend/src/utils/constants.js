// Shared, schema-aligned constants.
// These mirror the enums in prisma/schema.prisma. Keeping them in ONE place means
// we avoid "magic strings" scattered around and validation always matches the DB.

const ROLES = ['FARMER', 'VETERINARY_PROFESSIONAL', 'ADMIN'];

const ANIMAL_TYPES = ['CATTLE', 'GOATS', 'SHEEP', 'PIGS', 'POULTRY'];

const ANIMAL_SEXES = ['MALE', 'FEMALE'];

const RISK_LEVELS = ['LOW', 'MODERATE', 'HIGH'];

const REPORT_STATUSES = ['PENDING', 'REVIEWED', 'REFERRED', 'RESOLVED'];

const REFERRAL_STATUSES = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'DECLINED'];

const REMINDER_TYPES = ['VACCINATION', 'DEWORMING', 'DIPPING', 'PREGNANCY_CHECK', 'FOLLOW_UP', 'OTHER'];

const ALERT_TYPES = ['POSSIBLE_CLUSTER', 'HIGH_RISK', 'SYSTEM'];

// Zimbabwe provinces (V1 set). The app reads from this list so it can grow later.
const PROVINCES = [
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
];

module.exports = {
  ROLES,
  ANIMAL_TYPES,
  ANIMAL_SEXES,
  RISK_LEVELS,
  REPORT_STATUSES,
  REFERRAL_STATUSES,
  REMINDER_TYPES,
  ALERT_TYPES,
  PROVINCES,
};
