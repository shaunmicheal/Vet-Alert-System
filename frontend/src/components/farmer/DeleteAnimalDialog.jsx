import { useState } from 'react'
import { FiTrash2, FiX } from 'react-icons/fi'
import { deleteAnimal } from '../../api/animals'
import useDialogEffects from '../../hooks/useDialogEffects'
import { ANIMAL_TYPE_LABELS } from '../../utils/constants'
import { getApiErrorMessage } from '../../utils/errors'
import AlertMessage from '../ui/AlertMessage'
import Spinner from '../ui/Spinner'

// Confirmation dialog for deleting one animal.
// Backend behaviour (prisma onDelete: SetNull): the animal is removed from the
// farm, while health reports that referenced it are KEPT and simply unlinked.
export default function DeleteAnimalDialog({ animal, onCancel, onDeleted }) {
  useDialogEffects(onCancel)

  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)

  const typeLabel = ANIMAL_TYPE_LABELS[animal.animalType] || animal.animalType
  const displayName = animal.name || `this ${typeLabel.toLowerCase()}`

  const handleConfirm = () => {
    if (deleting) return
    setDeleting(true)
    setError(null)

    deleteAnimal(animal.id)
      .then(() => {
        onDeleted(animal)
      })
      .catch((requestError) => {
        // Keep the dialog open and the animal visible so the farmer can retry.
        setError(getApiErrorMessage(requestError))
        setDeleting(false)
      })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-animal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-charcoal-900/50"
        aria-label="Cancel deletion"
        onClick={onCancel}
      />

      <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-xl bg-white p-5 shadow-xl sm:rounded-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700">
            <FiTrash2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-2 text-charcoal-500 transition hover:bg-charcoal-100 hover:text-charcoal-800"
            aria-label="Cancel deletion"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <h2 id="delete-animal-title" className="mt-4 text-lg font-bold text-charcoal-900">
          Delete this animal?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-charcoal-600">
          {typeLabel} · {displayName} will be removed from your farm’s animal list. This cannot be
          undone.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-charcoal-600">
          Health reports that mention this animal are kept, but will no longer be linked to it.
        </p>

        {error && (
          <AlertMessage variant="error" className="mt-4">
            {error}
          </AlertMessage>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn btn-danger"
            disabled={deleting}
            aria-busy={deleting}
          >
            {deleting ? (
              <>
                <Spinner className="h-4 w-4" />
                Deleting…
              </>
            ) : (
              <>
                <FiTrash2 className="h-4 w-4" aria-hidden="true" />
                Delete animal
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}