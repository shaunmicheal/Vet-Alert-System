import { FiEdit3, FiTrash2 } from 'react-icons/fi'
import { ANIMAL_SEX_LABELS, ANIMAL_TYPE_LABELS } from '../../utils/constants'
import AnimalCard from './AnimalCard'

const show = (value) => value || '—'

export default function AnimalList({ animals, onEdit, onDelete }) {
  return (
    <>
      <div className="card hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Animals registered to your farm</caption>
          <thead className="bg-charcoal-100 text-xs font-semibold uppercase tracking-wider text-charcoal-500">
            <tr>
              <th scope="col" className="px-4 py-3">
                Type
              </th>
              <th scope="col" className="px-4 py-3">
                Name
              </th>
              <th scope="col" className="px-4 py-3">
                Tag number
              </th>
              <th scope="col" className="px-4 py-3">
                Breed
              </th>
              <th scope="col" className="px-4 py-3">
                Age
              </th>
              <th scope="col" className="px-4 py-3">
                Sex
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal-100">
            {animals.map((animal) => {
              const displayName = animal.name || 'Unnamed animal'
              return (
                <tr key={animal.id} className="hover:bg-cream-50">
                  <td className="px-4 py-3 font-medium text-charcoal-800">
                    {ANIMAL_TYPE_LABELS[animal.animalType] || animal.animalType}
                  </td>
                  <td className="px-4 py-3 text-charcoal-700">{show(animal.name)}</td>
                  <td className="px-4 py-3 text-charcoal-700">{show(animal.tagNumber)}</td>
                  <td className="px-4 py-3 text-charcoal-700">{show(animal.breed)}</td>
                  <td className="px-4 py-3 text-charcoal-700">
                    {animal.age != null ? animal.age : '—'}
                  </td>
                  <td className="px-4 py-3 text-charcoal-700">
                    {animal.sex ? ANIMAL_SEX_LABELS[animal.sex] || animal.sex : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(animal)}
                        className="btn btn-ghost px-2.5 py-2 text-xs"
                        aria-label={`Edit ${displayName}`}
                      >
                        <FiEdit3 className="h-3.5 w-3.5" aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(animal)}
                        className="btn px-2.5 py-2 text-xs text-red-700 hover:bg-red-50"
                        aria-label={`Delete ${displayName}`}
                      >
                        <FiTrash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {animals.map((animal) => (
          <AnimalCard key={animal.id} animal={animal} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </>
  )
}
