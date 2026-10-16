import { FiCheckCircle, FiShield } from 'react-icons/fi'
import { initialsFor, roleLabelFor } from '../../pages/account/accountShared'

export default function AccountSummary({ account }) {
  return (
    <section className="card overflow-hidden" aria-labelledby="account-summary-heading">
      <div className="card-header">
        <div className="flex items-center gap-3">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest-700 text-base font-bold text-white"
            role="img"
            aria-label={account.name || 'Account holder'}
          >
            {initialsFor(account.name)}
          </span>
          <div>
            <h2 id="account-summary-heading" className="text-base font-semibold text-charcoal-900">
              {account.name}
            </h2>
            <p className="text-sm text-charcoal-600">{account.email}</p>
          </div>
        </div>
        <span className="badge border-forest-200 bg-forest-50 text-forest-800">
          <FiShield className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          {roleLabelFor(account.role)}
        </span>
      </div>
      <dl className="grid gap-4 px-5 py-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
            Full name
          </dt>
          <dd className="mt-1 text-sm text-charcoal-800">{account.name}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
            Phone
          </dt>
          <dd className="mt-1 text-sm text-charcoal-800">{account.phone || 'Not provided'}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
            Member since
          </dt>
          <dd className="mt-1 text-sm text-charcoal-800">
            {account.createdAt
              ? new Date(account.createdAt).toLocaleDateString('en-ZA', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'}
          </dd>
        </div>
      </dl>
      <p className="flex items-center gap-2 border-t border-charcoal-100 bg-sage-50 px-5 py-3 text-xs text-charcoal-600">
        <FiCheckCircle className="h-3.5 w-3.5 text-forest-700" aria-hidden="true" />
        Signed in as {account.email}. Email and password changes apply immediately.
      </p>
    </section>
  )
}
