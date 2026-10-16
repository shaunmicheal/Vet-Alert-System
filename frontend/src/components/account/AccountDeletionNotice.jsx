import { FiTrash2 } from 'react-icons/fi'
import AlertMessage from '../ui/AlertMessage'

export default function AccountDeletionNotice() {
  return (
    <section
      className="card overflow-hidden border-red-200"
      aria-labelledby="account-delete-heading"
    >
      <div className="card-header border-red-100 bg-red-50">
        <h2 id="account-delete-heading" className="text-base font-semibold text-red-800">
          Delete account
        </h2>
      </div>
      <div className="space-y-3 px-5 py-4">
        <AlertMessage variant="warning" title="Account deletion is disabled for safety">
          <p>
            Deleting a farmer account would cascade-delete the farm, animals, health reports,
            referrals, and reminders linked to it, while breaking auditability for other users.
            VetAlert has no soft-delete mechanism and no approved data-retention policy, so
            self-service deletion is intentionally unavailable.
          </p>
          <p className="mt-2">
            To request removal, please contact your administrator so health-report history and
            referrals can be preserved or transferred first.
          </p>
        </AlertMessage>
        <button
          type="button"
          className="btn btn-danger"
          disabled
          aria-disabled="true"
          title="Account deletion is disabled"
        >
          <FiTrash2 className="h-4 w-4" aria-hidden="true" />
          Delete my account (disabled)
        </button>
      </div>
    </section>
  )
}
