import { FiShield } from 'react-icons/fi'
import EmptyState from './EmptyState'

// Reusable "not allowed" state (403-style), used by the unauthorized page.
export default function UnauthorizedState({ description, action }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        <EmptyState
          icon={FiShield}
          title="You don’t have access to this area"
          description={
            description ||
            'This section belongs to a different role. If you believe this is a mistake, please contact your VetAlert administrator.'
          }
          action={action}
          className="border-amber-200"
        />
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-charcoal-400">
          Error 403 · Unauthorized
        </p>
      </div>
    </div>
  )
}