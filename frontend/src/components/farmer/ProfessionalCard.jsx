import { FiAward, FiClock, FiMail, FiMapPin, FiPhone } from 'react-icons/fi'

// One professional in the veterinary directory. Contact details come straight
// from the backend record - there is no "Refer" action in this phase.
export default function ProfessionalCard({ professional }) {
  const { name, professionalType, province, district, specialisation, availability, phone, email } =
    professional

  const initials = name
    .replace(/^Dr\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  return (
    <article className="card flex h-full flex-col p-5">
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-700 text-sm font-bold text-cream-50"
          aria-hidden="true"
        >
          {initials}
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-charcoal-900">{name}</h3>
          <p className="mt-0.5 inline-flex items-center rounded-full border border-earth-200 bg-earth-50 px-2.5 py-0.5 text-xs font-medium text-earth-800">
            {professionalType}
          </p>
        </div>
      </div>

      <dl className="mt-4 flex-1 space-y-2.5 text-sm">
        <div className="flex items-start gap-2 text-charcoal-700">
          <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-charcoal-400" aria-hidden="true" />
          <span>
            <span className="sr-only">Location: </span>
            {district}, {province}
          </span>
        </div>

        {specialisation && (
          <div className="flex items-start gap-2 text-charcoal-700">
            <FiAward className="mt-0.5 h-4 w-4 shrink-0 text-charcoal-400" aria-hidden="true" />
            <span>
              <span className="sr-only">Specialisation: </span>
              {specialisation}
            </span>
          </div>
        )}

        {availability && (
          <div className="flex items-start gap-2 text-charcoal-700">
            <FiClock className="mt-0.5 h-4 w-4 shrink-0 text-charcoal-400" aria-hidden="true" />
            <span>
              <span className="sr-only">Availability: </span>
              {availability}
            </span>
          </div>
        )}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-charcoal-100 pt-4">
        {phone && (
          <a
            href={`tel:${phone.replace(/\s+/g, '')}`}
            className="btn btn-secondary min-h-[44px] px-3.5 py-2"
            aria-label={`Call ${name} on ${phone}`}
          >
            <FiPhone className="h-4 w-4" aria-hidden="true" />
            Call
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            className="btn btn-secondary min-h-[44px] px-3.5 py-2"
            aria-label={`Email ${name} at ${email}`}
          >
            <FiMail className="h-4 w-4" aria-hidden="true" />
            Email
          </a>
        )}
        <p className="w-full text-xs text-charcoal-500 sm:mt-1 sm:w-auto sm:self-end sm:pl-1">
          {phone}
          {email ? ` · ${email}` : ''}
        </p>
      </div>
    </article>
  )
}