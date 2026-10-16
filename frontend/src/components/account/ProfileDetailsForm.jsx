import AlertMessage from '../ui/AlertMessage'
import Spinner from '../ui/Spinner'
import { FiCheckCircle } from 'react-icons/fi'

export default function ProfileDetailsForm({ account, form, message, error, onSubmit }) {
  const { register, handleSubmit, formState } = form
  return (
    <section className="card overflow-hidden" aria-labelledby="account-details-heading">
      <div className="card-header">
        <h2 id="account-details-heading" className="text-base font-semibold text-charcoal-900">
          Profile details
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
            <label htmlFor="account-name" className="field-label">
              Full name
            </label>
            <input
              id="account-name"
              type="text"
              autoComplete="name"
              className="field-input"
              aria-invalid={formState.errors.name ? 'true' : 'false'}
              {...register('name')}
            />
            {formState.errors.name && (
              <p className="field-error" role="alert">
                {formState.errors.name.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="account-phone" className="field-label">
              Phone <span className="font-normal text-charcoal-400">(optional)</span>
            </label>
            <input
              id="account-phone"
              type="tel"
              autoComplete="tel"
              placeholder="e.g. +263 77 123 4567"
              className="field-input"
              aria-invalid={formState.errors.phone ? 'true' : 'false'}
              {...register('phone')}
            />
            {formState.errors.phone && (
              <p className="field-error" role="alert">
                {formState.errors.phone.message}
              </p>
            )}
          </div>
        </div>
        <div>
          <label htmlFor="account-email-readonly" className="field-label">
            Email address
          </label>
          <input
            id="account-email-readonly"
            type="email"
            value={account.email}
            disabled
            readOnly
            className="field-input disabled:cursor-not-allowed disabled:bg-charcoal-100"
          />
          <p className="mt-1.5 text-xs text-charcoal-500">
            Use the email section below to change your sign-in email securely.
          </p>
        </div>
        <div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={formState.isSubmitting}
            aria-busy={formState.isSubmitting}
          >
            {formState.isSubmitting ? (
              <>
                <Spinner className="h-4 w-4" />
                Saving…
              </>
            ) : (
              'Save details'
            )}
          </button>
        </div>
      </form>
    </section>
  )
}
