import { useCallback, useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FiRefreshCw } from 'react-icons/fi'
import { createMyFarm, getMyFarm, updateMyFarm } from '../../api/farmer'
import FarmOverviewCard from '../../components/farmer/FarmOverviewCard'
import AlertMessage from '../../components/ui/AlertMessage'
import Spinner from '../../components/ui/Spinner'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { PROVINCES } from '../../utils/constants'
import { getApiErrorMessage } from '../../utils/errors'

// Mirrors the backend farm schema (backend/src/routes/farmerRoutes.js):
// name/province/district required, ward/village/address/coordinates optional.
// Coordinates stay strings in the form and become numbers only when submitted.
const coordinateField = (label, min, max) =>
  z
    .string()
    .trim()
    .refine(
      (value) =>
        value === '' ||
        (!Number.isNaN(Number(value)) && Number(value) >= min && Number(value) <= max),
      { message: `${label} must be a number between ${min} and ${max}` },
    )

const farmSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Farm name must be at least 2 characters')
    .max(120, 'Farm name is too long'),
  province: z.enum(PROVINCES, 'Please select a province'),
  district: z.string().trim().min(2, 'District is required').max(120, 'District is too long'),
  ward: z.string().trim().max(120, 'Ward is too long'),
  village: z.string().trim().max(120, 'Village is too long'),
  address: z.string().trim().max(240, 'Address is too long'),
  latitude: coordinateField('Latitude', -90, 90),
  longitude: coordinateField('Longitude', -180, 180),
})

const EMPTY_VALUES = {
  name: '',
  province: '',
  district: '',
  ward: '',
  village: '',
  address: '',
  latitude: '',
  longitude: '',
}

const toFormValues = (farm) =>
  farm
    ? {
        name: farm.name || '',
        province: farm.province || '',
        district: farm.district || '',
        ward: farm.ward || '',
        village: farm.village || '',
        address: farm.address || '',
        latitude: farm.latitude == null ? '' : String(farm.latitude),
        longitude: farm.longitude == null ? '' : String(farm.longitude),
      }
    : EMPTY_VALUES

// Form values -> backend payload. Coordinates are sent only when provided
// (the backend update schema accepts numbers, never null).
const toPayload = (values) => {
  const payload = {
    name: values.name,
    province: values.province,
    district: values.district,
    ward: values.ward,
    village: values.village,
    address: values.address,
  }
  if (values.latitude !== '') payload.latitude = Number(values.latitude)
  if (values.longitude !== '') payload.longitude = Number(values.longitude)
  return payload
}

export default function FarmProfilePage() {
  useDocumentTitle('Farm Profile')

  const [farm, setFarm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [savedMessage, setSavedMessage] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(farmSchema),
    defaultValues: EMPTY_VALUES,
  })

  // Promise-chain style (like AuthProvider) so setState never runs synchronously
  // inside the mount effect.
  const loadFarm = useCallback(() => {
    return getMyFarm()
      .then((existing) => {
        setFarm(existing)
        setLoadError(null)
        reset(toFormValues(existing))
      })
      .catch((error) => {
        setLoadError(getApiErrorMessage(error))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [reset])

  // Retry handler (event context): show the loading state, then reload.
  const reloadFarm = () => {
    setLoading(true)
    setLoadError(null)
    loadFarm()
  }

  // Initial load. The first render already starts in the loading state.
  useEffect(() => {
    loadFarm()
  }, [loadFarm])

  // No farm yet -> create mode; otherwise edit mode.
  const isCreate = !farm

  const onSubmit = async (values) => {
    setSaveError(null)
    setSavedMessage(null)

    try {
      const payload = toPayload(values)
      const saved = isCreate ? await createMyFarm(payload) : await updateMyFarm(payload)
      setFarm(saved)
      reset(toFormValues(saved))
      setSavedMessage(isCreate ? 'Your farm profile has been created.' : 'Farm profile saved.')
    } catch (error) {
      const status = error && error.response ? error.response.status : null
      // 409 = a farm already exists; 404 = it was deleted elsewhere.
      // Re-sync with the backend so the form matches reality.
      if (status === 409 || status === 404) {
        await loadFarm()
      }
      setSaveError(getApiErrorMessage(error))
    }
  }
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">My Farm</p>
        <h1 className="mt-1 text-2xl font-bold text-charcoal-900">Farm Profile</h1>
        <p className="mt-1 text-sm text-charcoal-600">
          {isCreate
            ? 'Add your farm’s details so VetAlert can tailor early warnings for your area.'
            : 'Keep your farm details up to date so alerts and veterinary services stay accurate.'}
        </p>
      </header>

      {loading ? (
        <div
          className="card flex items-center justify-center gap-3 px-6 py-16"
          role="status"
          aria-live="polite"
        >
          <Spinner className="h-6 w-6 text-forest-700" />
          <p className="text-sm font-medium text-charcoal-600">Loading your farm profile…</p>
        </div>
      ) : loadError ? (
        <AlertMessage variant="error" title="We couldn’t load your farm profile">
          <p>{loadError}</p>
          <button type="button" onClick={reloadFarm} className="btn btn-secondary mt-3">
            <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </AlertMessage>
      ) : (
        <>
          {farm && <FarmOverviewCard farm={farm} />}

          {savedMessage && <AlertMessage variant="success">{savedMessage}</AlertMessage>}
          {saveError && <AlertMessage variant="error">{saveError}</AlertMessage>}

          <section className="card p-5 sm:p-6" aria-labelledby="farm-form-heading">
            <h2 id="farm-form-heading" className="text-base font-semibold text-charcoal-900">
              {isCreate ? 'Create your farm profile' : 'Edit farm details'}
            </h2>
            <p className="mt-1 text-sm text-charcoal-600">Fields marked with * are required.</p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-5">
              {/* Farm name */}
              <div>
                <label htmlFor="farm-name" className="field-label">
                  Farm name *
                </label>
                <input
                  id="farm-name"
                  type="text"
                  autoComplete="organization"
                  placeholder="e.g. Sunshine Farm"
                  className="field-input"
                  aria-invalid={errors.name ? 'true' : 'false'}
                  aria-describedby={errors.name ? 'farm-name-error' : undefined}
                  {...register('name')}
                />
                <FieldError id="farm-name-error" error={errors.name} />
              </div>

              {/* Province + District */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="farm-province" className="field-label">
                    Province *
                  </label>
                  <select
                    id="farm-province"
                    className="field-input pr-8"
                    aria-invalid={errors.province ? 'true' : 'false'}
                    aria-describedby={errors.province ? 'farm-province-error' : undefined}
                    {...register('province')}
                  >
                    <option value="">Select a province</option>
                    {PROVINCES.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                  <FieldError id="farm-province-error" error={errors.province} />
                </div>

                <div>
                  <label htmlFor="farm-district" className="field-label">
                    District *
                  </label>
                  <input
                    id="farm-district"
                    type="text"
                    autoComplete="address-level2"
                    placeholder="e.g. Mutare"
                    className="field-input"
                    aria-invalid={errors.district ? 'true' : 'false'}
                    aria-describedby={errors.district ? 'farm-district-error' : undefined}
                    {...register('district')}
                  />
                  <FieldError id="farm-district-error" error={errors.district} />
                </div>
              </div>
              {/* Ward + Village */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="farm-ward" className="field-label">
                    Ward <span className="font-normal text-charcoal-400">(optional)</span>
                  </label>
                  <input
                    id="farm-ward"
                    type="text"
                    placeholder="e.g. Ward 4"
                    className="field-input"
                    aria-invalid={errors.ward ? 'true' : 'false'}
                    aria-describedby={errors.ward ? 'farm-ward-error' : undefined}
                    {...register('ward')}
                  />
                  <FieldError id="farm-ward-error" error={errors.ward} />
                </div>

                <div>
                  <label htmlFor="farm-village" className="field-label">
                    Village <span className="font-normal text-charcoal-400">(optional)</span>
                  </label>
                  <input
                    id="farm-village"
                    type="text"
                    placeholder="e.g. Sakubva"
                    className="field-input"
                    aria-invalid={errors.village ? 'true' : 'false'}
                    aria-describedby={errors.village ? 'farm-village-error' : undefined}
                    {...register('village')}
                  />
                  <FieldError id="farm-village-error" error={errors.village} />
                </div>
              </div>

              {/* Address */}
              <div>
                <label htmlFor="farm-address" className="field-label">
                  Address <span className="font-normal text-charcoal-400">(optional)</span>
                </label>
                <input
                  id="farm-address"
                  type="text"
                  autoComplete="street-address"
                  placeholder="Physical address or nearest landmark"
                  className="field-input"
                  aria-invalid={errors.address ? 'true' : 'false'}
                  aria-describedby={errors.address ? 'farm-address-error' : undefined}
                  {...register('address')}
                />
                <FieldError id="farm-address-error" error={errors.address} />
              </div>

              {/* Coordinates */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="farm-latitude" className="field-label">
                    Latitude <span className="font-normal text-charcoal-400">(optional)</span>
                  </label>
                  <input
                    id="farm-latitude"
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g. -17.8253"
                    className="field-input"
                    aria-invalid={errors.latitude ? 'true' : 'false'}
                    aria-describedby={
                      errors.latitude
                        ? 'farm-latitude-error'
                        : 'farm-latitude-hint'
                    }
                    {...register('latitude')}
                  />
                  {!errors.latitude && (
                    <p id="farm-latitude-hint" className="mt-1.5 text-xs text-charcoal-500">
                      Decimal degrees between -90 and 90
                    </p>
                  )}
                  <FieldError id="farm-latitude-error" error={errors.latitude} />
                </div>

                <div>
                  <label htmlFor="farm-longitude" className="field-label">
                    Longitude <span className="font-normal text-charcoal-400">(optional)</span>
                  </label>
                  <input
                    id="farm-longitude"
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g. 32.6267"
                    className="field-input"
                    aria-invalid={errors.longitude ? 'true' : 'false'}
                    aria-describedby={
                      errors.longitude
                        ? 'farm-longitude-error'
                        : 'farm-longitude-hint'
                    }
                    {...register('longitude')}
                  />
                  {!errors.longitude && (
                    <p id="farm-longitude-hint" className="mt-1.5 text-xs text-charcoal-500">
                      Decimal degrees between -180 and 180
                    </p>
                  )}
                  <FieldError id="farm-longitude-error" error={errors.longitude} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 border-t border-charcoal-100 pt-5 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      Saving…
                    </>
                  ) : isCreate ? (
                    'Create farm profile'
                  ) : (
                    'Save changes'
                  )}
                </button>
                <p className="text-xs leading-relaxed text-charcoal-500">
                  {isCreate
                    ? 'You can add animals and health reports once your farm profile exists.'
                    : 'Changes apply immediately across your VetAlert workspace.'}
                </p>
              </div>
            </form>
          </section>
        </>
      )}
    </div>
  )
}

// Small inline field error shared by every field on this form.
function FieldError({ id, error }) {
  if (!error) return null
  return (
    <p id={id} className="field-error" role="alert">
      {error.message}
    </p>
  )
}