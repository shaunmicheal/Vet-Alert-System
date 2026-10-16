import { FiCheckCircle, FiMail } from 'react-icons/fi'
import AlertMessage from '../ui/AlertMessage'
import Spinner from '../ui/Spinner'

export default function AccountEmailForm({ form, message, error, onSubmit }) {
  const { register, handleSubmit, formState } = form
  return (
    <section className="card overflow-hidden" aria-labelledby="account-email-heading">
      <div className="card-header">
        <h2 id="account-email-heading" className="text-base font-semibold text-charcoal-900">
          Email address
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
          <div>
            <label htmlFor="account-new-email" className="field-label">
              New email address
            </label>
            <input
              id="account-new-email"
              type="email"
              autoComplete="email"
              className="field-input"
              aria-invalid={formState.errors.email ? 'true' : 'false'}
              {...register('email')}
            />
            {formState.errors.email && (
              <p className="field-error" role="alert">
                {formState.errors.email.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="account-email-password" className="field-label">
              Current password
            </label>
            <input
              id="account-email-password"
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
        </div>
        <p className="flex items-start gap-2 text-xs leading-relaxed text-charcoal-500">
          <FiMail className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          We verify your current password, normalize the new address, and check that it is not
          already in use before saving it.
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
                Updating email…
              </>
            ) : (
              'Update email'
            )}
          </button>
        </div>
      </form>
    </section>
  )
}
