import { useCallback, useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FiAward, FiClock, FiMail, FiMapPin, FiPhone, FiRefreshCw } from 'react-icons/fi'
import { getVetProfile, updateVetProfile } from '../../api/vet'
import AlertMessage from '../../components/ui/AlertMessage'
import Spinner from '../../components/ui/Spinner'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { PROVINCES } from '../../utils/constants'
import { getApiErrorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120, 'Name is too long'),
  professionalType: z
    .string()
    .trim()
    .min(2, 'Professional type must be at least 2 characters')
    .max(120, 'Professional type is too long'),
  phone: z.string().trim().min(5, 'Phone number is too short').max(30, 'Phone number is too long'),
  email: z
    .string()
    .trim()
    .max(160, 'Email is too long')
    .refine((value) => value === '' || z.email().safeParse(value).success, {
      message: 'Enter a valid email address',
    }),
  province: z.enum(PROVINCES, 'Please select a province'),
  district: z.string().trim().min(2, 'District is required').max(120, 'District is too long'),
  specialisation: z.string().trim().max(200, 'Specialisation is too long'),
  availability: z.string().trim().max(120, 'Availability is too long'),
})

const EDITABLE_FIELDS = Object.freeze([
  'name',
  'professionalType',
  'phone',
  'email',
  'province',
  'district',
  'specialisation',
  'availability',
])

const EMPTY_VALUES = {
  name: '',
  professionalType: '',
  phone: '',
  email: '',
  province: '',
  district: '',
  specialisation: '',
  availability: '',
}

const toFormValues = (profile) =>
  profile
    ? {
        name: profile.name || '',
        professionalType: profile.professionalType || '',
        phone: profile.phone || '',
        email: profile.email || '',
        province: profile.province || '',
        district: profile.district || '',
        specialisation: profile.specialisation || '',
        availability: profile.availability || '',
      }
    : EMPTY_VALUES

export default function VetProfilePage() {
  useDocumentTitle('Professional Profile')

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [savedMessage, setSavedMessage] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: EMPTY_VALUES,
  })

  const loadProfile = useCallback(() => {
    return getVetProfile()
      .then((record) => {
        setProfile(record)
        setLoadError(null)
        reset(toFormValues(record))
      })
      .catch((error) => {
        setLoadError(getApiErrorMessage(error))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [reset])

  const reloadProfile = () => {
    setLoading(true)
    setLoadError(null)
    setSaveError(null)
    setSavedMessage(null)
    loadProfile()
  }

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const onSubmit = async (values) => {
    setSaveError(null)
    setSavedMessage(null)

    const payload = {}
    EDITABLE_FIELDS.forEach((field) => {
      if (!dirtyFields[field]) return
      if (field === 'email' && values.email === '') return
      payload[field] = values[field]
    })

    if (Object.keys(payload).length === 0) {
      setSaveError('Your email address cannot be left blank. Enter a valid address or restore the current one.')
      return
    }

    try {
      const saved = await updateVetProfile(payload)
      setProfile(saved)
      reset(toFormValues(saved))
      setSavedMessage('Your professional profile has been saved.')
    } catch (error) {
      const status = error && error.response ? error.response.status : null
      if (status === 404) {
        await loadProfile()
      }
      setSaveError(getApiErrorMessage(error))
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">My Profile</p>
        <h1 className="mt-1 text-2xl font-bold text-charcoal-900">Professional Profile</h1>
        <p className="mt-1 text-sm text-charcoal-600">
          Keep your professional details up to date so farmers can find you and reach you for referrals.
        </p>
      </header>

      {!loading && savedMessage && <AlertMessage variant="success">{savedMessage}</AlertMessage>}
      {!loading && saveError && <AlertMessage variant="error">{saveError}</AlertMessage>}

      {loading ? (
        <div
          className="card flex items-center justify-center gap-3 px-6 py-16"
          role="status"
          aria-live="polite"
        >
          <Spinner className="h-6 w-6 text-forest-700" />
          <p className="text-sm font-medium text-charcoal-600">Loading your professional profile…</p>
        </div>
      ) : loadError ? (
        <AlertMessage variant="error" title="We couldn’t load your profile">
          <p>{loadError}</p>
          <button type="button" onClick={reloadProfile} className="btn btn-secondary mt-3">
            <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </AlertMessage>
      ) : !profile ? (
        <AlertMessage variant="warning" title="Your professional profile has not been set up yet">
          <p>
            Your account does not have a professional record yet, so there is nothing to display
            or edit. Please contact a VetAlert administrator to set it up.
          </p>
          <button type="button" onClick={reloadProfile} className="btn btn-secondary mt-3">
            <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
        </AlertMessage>
      ) : (
        <>
          <section className="card p-5 sm:p-6" aria-labelledby="profile-overview-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id="profile-overview-title" className="text-base font-semibold text-charcoal-900">
                  {profile.name}
                </h2>
                <p className="mt-0.5 text-sm text-charcoal-600">{profile.professionalType}</p>
              </div>
              <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    profile.isActive
                      ? 'border-forest-200 bg-forest-50 text-forest-800'
                      : 'border-amber-200 bg-amber-50 text-amber-800'
                  }`}
                >
                  {profile.isActive ? 'Active' : 'Inactive'}
                </span>
                {profile.updatedAt && (
                  <p className="text-xs text-charcoal-500">Last updated {formatDate(profile.updatedAt)}</p>
                )}
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-charcoal-500">
              {profile.isActive
                ? 'Your profile is listed in the veterinary directory farmers use to find professionals and send referrals.'
                : 'Your profile is hidden from the veterinary directory while it is inactive. This status is read-only for veterinary professionals.'}
            </p>

            <dl className="mt-4 grid gap-x-6 gap-y-4 border-t border-charcoal-100 pt-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Phone" Icon={FiPhone}>
                {profile.phone}
              </DetailItem>
              <DetailItem label="Email" Icon={FiMail}>
                {profile.email || <span className="text-charcoal-400">Not provided</span>}
              </DetailItem>
              <DetailItem label="Province" Icon={FiMapPin}>
                {profile.province}
              </DetailItem>
              <DetailItem label="District" Icon={FiMapPin}>
                {profile.district}
              </DetailItem>
              <DetailItem label="Specialisation" Icon={FiAward}>
                {profile.specialisation || <span className="text-charcoal-400">Not set</span>}
              </DetailItem>
              <DetailItem label="Availability" Icon={FiClock}>
                {profile.availability || <span className="text-charcoal-400">Not set</span>}
              </DetailItem>
            </dl>
          </section>
          <section className="card p-5 sm:p-6" aria-labelledby="profile-form-heading">
            <h2 id="profile-form-heading" className="text-base font-semibold text-charcoal-900">
              Edit profile
            </h2>
            <p className="mt-1 text-sm text-charcoal-600">Fields marked with * are required.</p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="profile-name" className="field-label">
                    Full name *
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    autoComplete="name"
                    className="field-input"
                    aria-invalid={errors.name ? 'true' : 'false'}
                    aria-describedby={errors.name ? 'profile-name-error' : undefined}
                    {...register('name')}
                  />
                  <FieldError id="profile-name-error" error={errors.name} />
                </div>

                <div>
                  <label htmlFor="profile-type" className="field-label">
                    Professional type *
                  </label>
                  <input
                    id="profile-type"
                    type="text"
                    placeholder="e.g. Veterinary Surgeon"
                    className="field-input"
                    aria-invalid={errors.professionalType ? 'true' : 'false'}
                    aria-describedby={errors.professionalType ? 'profile-type-error' : undefined}
                    {...register('professionalType')}
                  />
                  <FieldError id="profile-type-error" error={errors.professionalType} />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="profile-phone" className="field-label">
                    Phone number *
                  </label>
                  <input
                    id="profile-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="e.g. +263 77 123 4567"
                    className="field-input"
                    aria-invalid={errors.phone ? 'true' : 'false'}
                    aria-describedby={errors.phone ? 'profile-phone-error' : undefined}
                    {...register('phone')}
                  />
                  <FieldError id="profile-phone-error" error={errors.phone} />
                </div>

                <div>
                  <label htmlFor="profile-email" className="field-label">
                    Email address
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="field-input"
                    aria-invalid={errors.email ? 'true' : 'false'}
                    aria-describedby={errors.email ? 'profile-email-error' : 'profile-email-hint'}
                    {...register('email')}
                  />
                  {!errors.email && (
                    <p id="profile-email-hint" className="mt-1.5 text-xs text-charcoal-500">
                      {profile.email
                        ? 'Shown to farmers who find you in the directory. Leave blank to keep your current address.'
                        : 'Optional. Add an address farmers can use to reach you.'}
                    </p>
                  )}
                  <FieldError id="profile-email-error" error={errors.email} />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="profile-province" className="field-label">
                    Province *
                  </label>
                  <select
                    id="profile-province"
                    className="field-input pr-8"
                    aria-invalid={errors.province ? 'true' : 'false'}
                    aria-describedby={errors.province ? 'profile-province-error' : undefined}
                    {...register('province')}
                  >
                    <option value="">Select a province</option>
                    {PROVINCES.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                  <FieldError id="profile-province-error" error={errors.province} />
                </div>

                <div>
                  <label htmlFor="profile-district" className="field-label">
                    District *
                  </label>
                  <input
                    id="profile-district"
                    type="text"
                    className="field-input"
                    aria-invalid={errors.district ? 'true' : 'false'}
                    aria-describedby={errors.district ? 'profile-district-error' : undefined}
                    {...register('district')}
                  />
                  <FieldError id="profile-district-error" error={errors.district} />
                </div>
              </div>

              <div>
                <label htmlFor="profile-specialisation" className="field-label">
                  Specialisation <span className="font-normal text-charcoal-400">(optional)</span>
                </label>
                <textarea
                  id="profile-specialisation"
                  rows={2}
                  placeholder="e.g. Cattle, goats and wildlife"
                  className="field-input resize-y"
                  aria-invalid={errors.specialisation ? 'true' : 'false'}
                  aria-describedby={
                    errors.specialisation
                      ? 'profile-specialisation-error'
                      : 'profile-specialisation-hint'
                  }
                  {...register('specialisation')}
                />
                {!errors.specialisation && (
                  <p id="profile-specialisation-hint" className="mt-1.5 text-xs text-charcoal-500">
                    Shown in the veterinary directory. Up to 200 characters.
                  </p>
                )}
                <FieldError id="profile-specialisation-error" error={errors.specialisation} />
              </div>

              <div>
                <label htmlFor="profile-availability" className="field-label">
                  Availability <span className="font-normal text-charcoal-400">(optional)</span>
                </label>
                <input
                  id="profile-availability"
                  type="text"
                  placeholder="e.g. Weekends 9-1"
                  className="field-input"
                  aria-invalid={errors.availability ? 'true' : 'false'}
                  aria-describedby={
                    errors.availability ? 'profile-availability-error' : 'profile-availability-hint'
                  }
                  {...register('availability')}
                />
                {!errors.availability && (
                  <p id="profile-availability-hint" className="mt-1.5 text-xs text-charcoal-500">
                    Let farmers know when you can take calls. Up to 120 characters.
                  </p>
                )}
                <FieldError id="profile-availability-error" error={errors.availability} />
              </div>

              <div className="flex flex-col gap-3 border-t border-charcoal-100 pt-5 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || !isDirty}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      Saving…
                    </>
                  ) : (
                    'Save changes'
                  )}
                </button>
                <p className="text-xs leading-relaxed text-charcoal-500">
                  {isDirty
                    ? 'Only the fields you changed are sent to the server.'
                    : 'No changes yet - edit a field to enable saving.'}
                </p>
              </div>
            </form>
          </section>
        </>
      )}
    </div>
  )
}

function FieldError({ id, error }) {
  if (!error) return null
  return (
    <p id={id} className="field-error" role="alert">
      {error.message}
    </p>
  )
}

function DetailItem({ label, Icon, children }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-charcoal-500">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-charcoal-800">{children}</dd>
    </div>
  )
}
