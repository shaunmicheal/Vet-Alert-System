import { GiCow } from 'react-icons/gi'
import { FaUserMd } from 'react-icons/fa'
import {
  FiAlertTriangle,
  FiBarChart2,
  FiBell,
  FiClipboard,
  FiFileText,
  FiHome,
  FiMapPin,
  FiShare2,
  FiShield,
  FiUser,
} from 'react-icons/fi'
import { ROLES } from './constants'

export const ROLE_LABELS = Object.freeze({
  [ROLES.FARMER]: 'Farmer',
  [ROLES.VETERINARY_PROFESSIONAL]: 'Veterinary Professional',
  [ROLES.ADMIN]: 'Administrator',
})

export const ROLE_NAVIGATION = Object.freeze({
  [ROLES.FARMER]: [
    { label: 'Dashboard', path: '/farmer', icon: FiHome, end: true },
    { label: 'Farm Profile', path: '/farmer/farm', icon: FiMapPin },
    { label: 'My Animals', path: '/farmer/animals', icon: GiCow },
    { label: 'Health Reports', path: '/farmer/reports', icon: FiFileText },
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
    { label: 'Users', path: '/admin/users', icon: FiUser },
    { label: 'Reports', path: '/admin/reports', icon: FiFileText },
    { label: 'Referrals', path: '/admin/referrals', icon: FiShare2 },
    { label: 'Veterinary', path: '/admin/veterinary', icon: FaUserMd },
    { label: 'Oversight', path: '/admin/oversight', icon: FiShield },
  ],
})

export const navigationForRole = (role) => ROLE_NAVIGATION[role] || []
