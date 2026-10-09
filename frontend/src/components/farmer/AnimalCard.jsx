import { FiEdit3, FiTrash2 } from 'react-icons/fi'
import { ANIMAL_SEX_LABELS, ANIMAL_TYPE_LABELS } from '../../utils/constants'

const show = (value) => value || '—'

export default function AnimalCard({ animal, onEdit, onDelete }) {
  const typeLabel = ANIMAL_TYPE_LABELS[animal.animalType] || animal.animalType
  const displayName = animal.name || 'Unnamed animal'

  return (
    <article className="card p-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">
          {typeLabel}
        </p>
        <h3 className="mt-0.5 truncate text-base font-semibold text-charcoal-900">
          {displayName}
        </h3>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <dt className="text-xs font-medium text-charcoal-400">Tag number</dt>
          <dd className="mt-0.5 text-sm text-charcoal-800">{show(animal.tagNumber)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-charcoal-400">Breed</dt>
          <dd className="mt-0.5 text-sm text-charcoal-800">{show(animal.breed)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-charcoal-400">Age</dt>
          <dd className="mt-0.5 text-sm text-charcoal-800">
            {animal.age != null ? animal.age : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-charcoal-400">Sex</dt>
          <dd className="mt-0.5 text-sm text-charcoal-800">
            {animal.sex ? ANIMAL_SEX_LABELS[animal.sex] || animal.sex : '—'}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(animal)}
          className="btn btn-secondary min-h-[44px] flex-1"
          aria-label={`Edit ${displayName}`}
        >
          <FiEdit3 className="h-4 w-4" aria-hidden="true" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(animal)}
          className="btn min-h-[44px] flex-1 border border-red-200 bg-white text-red-700 hover:bg-red-50"
          aria-label={`Delete ${displayName}`}
        >
          <FiTrash2 className="h-4 w-4" aria-hidden="true" />
          Delete
        </button>
      </div>
    </article>
  )
}
