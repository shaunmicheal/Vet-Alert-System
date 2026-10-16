import { FiAlertTriangle, FiFlag } from 'react-icons/fi'
import AlertMessage from '../ui/AlertMessage'
import { VET_DEMO_DIRECTORY_MESSAGE, VET_DEMO_MODE_ENABLED } from '../../utils/vetDemoMode'

/**
 * Small amber badge that marks a directory record as a demonstration profile.
 * Uses the shared `.badge` class so it matches every other status badge.
 */
export function DemoProfileBadge({ className = '' }) {
  if (!VET_DEMO_MODE_ENABLED) return null
  return (
    <span className={`badge border-amber-200 bg-amber-50 text-amber-800 ${className}`}>
      <FiFlag className="h-3 w-3" aria-hidden="true" />
      Demonstration profile
    </span>
  )
}

/**
 * Accessible warning banner shown once per page (never repeated per card).
 * Rendered only while the public demo-mode UI flag is enabled.
 */
export default function VetDemoModeBanner({ message = VET_DEMO_DIRECTORY_MESSAGE, className = '' }) {
  if (!VET_DEMO_MODE_ENABLED) return null
  return (
    <AlertMessage variant="warning" title="Demonstration mode" className={className}>
      <p className="flex items-start gap-1.5">
        <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{message}</span>
      </p>
    </AlertMessage>
  )
}
