export const initialsFor = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '?'

export const roleLabelFor = (role) =>
  role === 'VETERINARY_PROFESSIONAL'
    ? 'Veterinary Professional'
    : role === 'ADMIN'
      ? 'Administrator'
      : 'Farmer'

