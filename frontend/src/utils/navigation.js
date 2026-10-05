import { FaPaw, FaUserMd } from 'react-icons/fa'
import {
  FiAlertTriangle,
  FiBarChart2,
  FiBell,
  FiClipboard,
  FiFileText,
  FiHome,
  FiShare2,
  FiShield,
  FiUser,
} from 'react-icons/fi'
import { ROLES } from './constants'

// Centralised, role-aware navigation. The app shell reads from here, so future
// phases only need to replace placeholder routes with real pages.
export const ROLE_LABELS = Object.freeze({
  [ROLES.FARMER]: 'Farmer',
  [ROLES.VETERINARY_PROFESSIONAL]: 'Veterinary Professional',
  [ROLES.ADMIN]: 'Administrator',
})

export const ROLE_NAVIGATION = Object.freeze({
  [ROLES.FARMER]: [
    { label: 'Dashboard', path: '/farmer', icon: FiHome, end: true },
    { label: 'Health Reports', path: '/farmer/reports', icon: FiFileText },
    { label: 'My Animals', path: '/farmer/animals', icon: FaPaw },
    { label: 'Referrals', path: '/farmer/referrals', icon: FiShare2 },
    { label: 'Reminders', path: '/farmer/reminders', icon: FiBell },
    { label: 'Veterinary Directory', path: '/farmer/veterinarians', icon: FaUserMd },
  ],
  [ROLES.VETERINARY_PROFESSIONAL]: [
    { label: 'Dashboard', path: '/vet', icon: FiHome, end: true },
    { label: 'Assigned Cases', path: '/vet/cases', icon: FiClipboard },
    { label: 'My Profile', path: '/vet/profile', icon: FiUser },
  ],
  [ROLES.ADMIN]: [
    { label: 'Dashboard', path: '/admin', icon: FiHome, end: true },
    { label: 'Alerts', path: '/admin/alerts', icon: FiAlertTriangle },
    { label: 'Statistics', path: '/admin/statistics', icon: FiBarChart2 },
    { label: 'Oversight', path: '/admin/oversight', icon: FiShield },
  ],
})

export const navigationForRole = (role) => ROLE_NAVIGATION[role] || []