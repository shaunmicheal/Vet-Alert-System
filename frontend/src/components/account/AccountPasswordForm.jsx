import { FiCheckCircle, FiLock } from 'react-icons/fi'
import AlertMessage from '../ui/AlertMessage'
import Spinner from '../ui/Spinner'

export default function AccountPasswordForm({ form, message, error, onSubmit }) {
  const { register, handleSubmit, formState } = form
  return (
    <section className="card overflow-hidden" aria-labelledby="account-password-heading">
      <div className="card-header">
        <h2 id="account-password-heading" className="text-base font-semibold text-charcoal-900">
          Password and security
        </h2>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 px-5 py-4">
        {message && (
          <AlertMessage variant="success">
            <p className="flex items-center gap-2">
              <FiCheckCircle className="h-4 w-4" aria-hidden="true" />
              {message}
            </p>
          </AlertMessage>
        )}
        {error && (
          <AlertMessage variant="error">
            <p>{error}</p>
          </AlertMessage>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="account-current-password" className="field-label">
              Current password
            </label>
            <input
              id="account-current-password"
              type="password"
              autoComplete="current-password"
              className="field-input"
              aria-invalid={formState.errors.currentPassword ? 'true' : 'false'}
              {...register('currentPassword')}
            />
            {formState.errors.currentPassword && (
              <p className="field-error" role="alert">
                {formState.errors.currentPassword.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="account-new-password" className="field-label">
              New password
            </label>
            <input
              id="account-new-password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="field-input"
              aria-invalid={formState.errors.newPassword ? 'true' : 'false'}
              {...register('newPassword')}
            />
            {formState.errors.newPassword && (
              <p className="field-error" role="alert">
                {formState.errors.newPassword.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="account-confirm-password" className="field-label">
              Confirm new password
            </label>
            <input
              id="account-confirm-password"
              type="password"
              autoComplete="new-password"
              className="field-input"
              aria-invalid={formState.errors.confirmPassword ? 'true' : 'false'}
              {...register('confirmPassword')}
            />
            {formState.errors.confirmPassword && (
              <p className="field-error" role="alert">
                {formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>
        <p className="flex items-start gap-2 text-xs leading-relaxed text-charcoal-500">
          <FiLock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Passwords are verified and hashed with bcrypt on the server. Tokens are stateless
          JWTs, so a password change does not revoke already-issued tokens before expiry.
        </p>
        <div>
          <button
            type="submit"
            className="btn btn-secondary"
            disabled={formState.isSubmitting}
            aria-busy={formState.isSubmitting}
          >
            {formState.isSubmitting ? (
              <>
                <Spinner className="h-4 w-4" />
                Updating password…
              </>
            ) : (
              'Update password'
            )}
          </button>
        </div>
      </form>
    </section>
  )
}
