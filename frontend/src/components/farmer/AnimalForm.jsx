import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FiX } from 'react-icons/fi'
import { createAnimal, updateAnimal } from '../../api/animals'
import useDialogEffects from '../../hooks/useDialogEffects'
import {
  ANIMAL_SEXES,
  ANIMAL_TYPES,
  ANIMAL_TYPE_LABELS,
} from '../../utils/constants'
import { getApiErrorMessage } from '../../utils/errors'
import AlertMessage from '../ui/AlertMessage'
import Spinner from '../ui/Spinner'

// Mirrors the backend animal schema (backend/src/routes/animalRoutes.js):
// animalType required on create; name/tag/breed/age/sex optional.
// Empty strings are OMITTED from the payload (the backend rejects them).
const animalSchema = z.object({
  animalType: z.enum(ANIMAL_TYPES, 'Please select an animal type'),
  name: z.string().trim().max(80, 'Name must be 80 characters or fewer'),
  tagNumber: z.string().trim().max(60, 'Tag number must be 60 characters or fewer'),
  breed: z.string().trim().max(80, 'Breed must be 80 characters or fewer'),
  age: z
    .string()
    .trim()
    .refine((value) => value === '' || (/^\d+$/.test(value) && Number(value) <= 100), {
      message: 'Age must be a whole number between 0 and 100',
    }),
  sex: z.enum(['', 'MALE', 'FEMALE']),
})

const EMPTY_VALUES = {
  animalType: '',
  name: '',
  tagNumber: '',
  breed: '',
  age: '',
  sex: '',
}

const toFormValues = (animal) =>
  animal
    ? {
        animalType: animal.animalType,
        name: animal.name || '',
        tagNumber: animal.tagNumber || '',
        breed: animal.breed || '',
        age: animal.age == null ? '' : String(animal.age),
        sex: animal.sex || '',
      }
    : EMPTY_VALUES

// Form values -> backend payload. Blank optional fields are left out so the
// backend keeps whatever it already stores (its schema rejects empty strings).
const toPayload = (values) => {
  const payload = { animalType: values.animalType }
  if (values.name !== '') payload.name = values.name
  if (values.tagNumber !== '') payload.tagNumber = values.tagNumber
  if (values.breed !== '') payload.breed = values.breed
  if (values.age !== '') payload.age = Number(values.age)
  if (values.sex !== '') payload.sex = values.sex
  return payload
}

// Add/edit dialog for one animal. `animal` is null when creating.
export default function AnimalForm({ animal, onClose, onSaved }) {
  const isEdit = Boolean(animal)
  useDialogEffects(onClose)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(animalSchema),
    defaultValues: toFormValues(animal),
  })

  const [formError, setFormError] = useState(null)

  const onSubmit = async (values) => {
    setFormError(null)
    try {
      const payload = toPayload(values)
      const saved = isEdit ? await updateAnimal(animal.id, payload) : await createAnimal(payload)
      onSaved(saved)
    } catch (error) {
      setFormError(getApiErrorMessage(error))
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="animal-form-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-charcoal-900/50"
        aria-label="Close dialog"
        onClick={onClose}
      />

      <div className="relative flex max-h-[92vh] w-full flex-col overflow-y-auto rounded-t-xl bg-white shadow-xl sm:max-w-lg sm:rounded-xl">
        <header className="flex items-start justify-between gap-3 border-b border-charcoal-100 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">
              Animals
            </p>
            <h2 id="animal-form-title" className="mt-0.5 text-lg font-bold text-charcoal-900">
              {isEdit ? 'Edit animal' : 'Add animal'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-charcoal-500 transition hover:bg-charcoal-100 hover:text-charcoal-800"
            aria-label="Close dialog"
          >
            <FiX className="h-5 w-5" />
          </button>
        </header>

        <div className="px-5 py-5 sm:px-6">
          {formError && (
            <AlertMessage variant="error" className="mb-5">
              {formError}
            </AlertMessage>
          )}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Animal type (required by the backend on create) */}
            <div>
              <label htmlFor="animal-type" className="field-label">
                Animal type *
              </label>
              <select
                id="animal-type"
                className="field-input pr-8"
                autoFocus
                aria-invalid={errors.animalType ? 'true' : 'false'}
                aria-describedby={errors.animalType ? 'animal-type-error' : undefined}
                {...register('animalType')}
              >
                <option value="">Select an animal type</option>
                {ANIMAL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {ANIMAL_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
              {errors.animalType && (
                <p id="animal-type-error" className="field-error" role="alert">
                  {errors.animalType.message}
                </p>
              )}
            </div>

            {/* Name */}
            <div>
              <label htmlFor="animal-name" className="field-label">
                Name <span className="font-normal text-charcoal-400">(optional)</span>
              </label>
              <input
                id="animal-name"
                type="text"
                placeholder="e.g. Bella"
                className="field-input"
                aria-invalid={errors.name ? 'true' : 'false'}
                aria-describedby={errors.name ? 'animal-name-error' : undefined}
                {...register('name')}
              />
              {errors.name && (
                <p id="animal-name-error" className="field-error" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Tag number + Breed */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="animal-tag" className="field-label">
                  Tag number <span className="font-normal text-charcoal-400">(optional)</span>
                </label>
                <input
                  id="animal-tag"
                  type="text"
                  placeholder="e.g. A-101"
                  className="field-input"
                  aria-invalid={errors.tagNumber ? 'true' : 'false'}
                  aria-describedby={errors.tagNumber ? 'animal-tag-error' : undefined}
                  {...register('tagNumber')}
                />
                {errors.tagNumber && (
                  <p id="animal-tag-error" className="field-error" role="alert">
                    {errors.tagNumber.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="animal-breed" className="field-label">
                  Breed <span className="font-normal text-charcoal-400">(optional)</span>
                </label>
                <input
                  id="animal-breed"
                  type="text"
                  placeholder="e.g. Boran"
                  className="field-input"
                  aria-invalid={errors.breed ? 'true' : 'false'}
                  aria-describedby={errors.breed ? 'animal-breed-error' : undefined}
                  {...register('breed')}
                />
                {errors.breed && (
                  <p id="animal-breed-error" className="field-error" role="alert">
                    {errors.breed.message}
                  </p>
                )}
              </div>
            </div>
            {/* Age + Sex */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="animal-age" className="field-label">
                  Age <span className="font-normal text-charcoal-400">(optional)</span>
                </label>
                <input
                  id="animal-age"
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 3"
                  className="field-input"
                  aria-invalid={errors.age ? 'true' : 'false'}
                  aria-describedby={errors.age ? 'animal-age-error' : undefined}
                  {...register('age')}
                />
                {errors.age && (
                  <p id="animal-age-error" className="field-error" role="alert">
                    {errors.age.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="animal-sex" className="field-label">
                  Sex <span className="font-normal text-charcoal-400">(optional)</span>
                </label>
                <select
                  id="animal-sex"
                  className="field-input pr-8"
                  aria-invalid={errors.sex ? 'true' : 'false'}
                  aria-describedby={errors.sex ? 'animal-sex-error' : undefined}
                  {...register('sex')}
                >
                  <option value="">Not specified</option>
                  {ANIMAL_SEXES.map((sex) => (
                    <option key={sex} value={sex}>
                      {sex === 'MALE' ? 'Male' : 'Female'}
                    </option>
                  ))}
                </select>
                {errors.sex && (
                  <p id="animal-sex-error" className="field-error" role="alert">
                    {errors.sex.message}
                  </p>
                )}
              </div>
            </div>

            {isEdit && (
              <p className="text-xs leading-relaxed text-charcoal-500">
                Leave a field blank to keep its current value.
              </p>
            )}

            <div className="flex flex-col gap-3 border-t border-charcoal-100 pt-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
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
                ) : isEdit ? (
                  'Save changes'
                ) : (
                  'Add animal'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}