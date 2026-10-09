import { useCallback, useEffect, useMemo, useState } from 'react'
import { GiCow } from 'react-icons/gi'
import { FiPlus, FiRefreshCw, FiSearch, FiX } from 'react-icons/fi'
import { getMyAnimals } from '../../api/animals'
import AnimalForm from '../../components/farmer/AnimalForm'
import AnimalList from '../../components/farmer/AnimalList'
import AnimalSummaryCard from '../../components/farmer/AnimalSummaryCard'
import DeleteAnimalDialog from '../../components/farmer/DeleteAnimalDialog'
import AlertMessage from '../../components/ui/AlertMessage'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { ANIMAL_TYPES, ANIMAL_TYPE_LABELS } from '../../utils/constants'
import { getApiErrorMessage } from '../../utils/errors'

export default function AnimalsPage() {
  useDocumentTitle('Animals')

  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [dialog, setDialog] = useState(null)
  const [flash, setFlash] = useState(null)

  const loadAnimals = useCallback(() => {
    return getMyAnimals()
      .then((list) => {
        setAnimals(list)
        setLoadError(null)
      })
      .catch((error) => {
        setLoadError(getApiErrorMessage(error))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const reloadAnimals = () => {
    setLoading(true)
    setLoadError(null)
    loadAnimals()
  }

  useEffect(() => {
    loadAnimals()
  }, [loadAnimals])

  const counts = useMemo(() => {
    const totals = { total: animals.length }
    ANIMAL_TYPES.forEach((type) => {
      totals[type] = 0
    })
    animals.forEach((animal) => {
      totals[animal.animalType] = (totals[animal.animalType] || 0) + 1
    })
    return totals
  }, [animals])

  const visibleAnimals = useMemo(() => {
    const query = search.trim().toLowerCase()
    return animals.filter((animal) => {
      if (typeFilter && animal.animalType !== typeFilter) return false
      if (!query) return true
      return [animal.name, animal.tagNumber, animal.breed].some(
        (field) => field && field.toLowerCase().includes(query),
      )
    })
  }, [animals, search, typeFilter])

  const filtersActive = search.trim() !== '' || typeFilter !== ''

  const openCreate = () => {
    setFlash(null)
    setDialog({ mode: 'create' })
  }

  const openEdit = (animal) => {
    setFlash(null)
    setDialog({ mode: 'edit', animal })
  }

  const openDelete = (animal) => setDialog({ mode: 'delete', animal })
  const closeDialog = () => setDialog(null)

  const handleSaved = (saved) => {
    const wasEdit = Boolean(dialog) && dialog.mode === 'edit'
    setAnimals((previous) =>
      wasEdit
        ? previous.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...previous],
    )
    setDialog(null)
    const label = ANIMAL_TYPE_LABELS[saved.animalType] || 'Animal'
    setFlash({
      message: wasEdit ? `${label} details updated.` : `${label} added to your animal list.`,
    })
  }

  const handleDeleted = (deleted) => {
    setAnimals((previous) => previous.filter((item) => item.id !== deleted.id))
    setDialog(null)
    const label = ANIMAL_TYPE_LABELS[deleted.animalType] || 'Animal'
    setFlash({ message: `${label} removed from your animal list.` })
  }

  const clearFilters = () => {
    setSearch('')
    setTypeFilter('')
  }
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">My Farm</p>
          <h1 className="mt-1 text-2xl font-bold text-charcoal-900">Animals</h1>
          <p className="mt-1 text-sm text-charcoal-600">
            Manage the livestock registered to your farm.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn btn-primary self-start sm:self-auto"
        >
          <FiPlus className="h-4 w-4" aria-hidden="true" />
          Add Animal
        </button>
      </header>

      {flash && (
        <AlertMessage variant="success">
          <div className="flex items-start justify-between gap-3">
            <p>{flash.message}</p>
            <button
              type="button"
              onClick={() => setFlash(null)}
              aria-label="Dismiss message"
              className="shrink-0 rounded-md p-1 transition hover:bg-forest-100"
            >
              <FiX className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </AlertMessage>
      )}

      {loading ? (
        <div
          className="card flex items-center justify-center gap-3 px-6 py-16"
          role="status"
          aria-live="polite"
        >
          <Spinner className="h-6 w-6 text-forest-700" />
          <p className="text-sm font-medium text-charcoal-600">Loading your animals…</p>
        </div>
      ) : loadError ? (
        <AlertMessage variant="error" title="We couldn’t load your animals">
          <p>{loadError}</p>
          <button type="button" onClick={reloadAnimals} className="btn btn-secondary mt-3">
            <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </AlertMessage>
      ) : animals.length === 0 ? (
        <EmptyState
          icon={GiCow}
          title="No animals registered yet"
          description="Adding your animals helps VetAlert link health reports to the right livestock and gives veterinary professionals a clear picture of your farm."
          action={
            <button type="button" onClick={openCreate} className="btn btn-primary">
              <FiPlus className="h-4 w-4" aria-hidden="true" />
              Add your first animal
            </button>
          }
        />
      ) : (
        <>
          <section
            aria-label="Animal summary"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
          >
            <AnimalSummaryCard label="Total animals" count={counts.total} highlight />
            {ANIMAL_TYPES.map((type) => (
              <AnimalSummaryCard
                key={type}
                label={ANIMAL_TYPE_LABELS[type]}
                count={counts[type] || 0}
              />
            ))}
          </section>

          <section aria-label="Search and filter animals" className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <label htmlFor="animal-search" className="sr-only">
                Search animals
              </label>
              <FiSearch
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400"
                aria-hidden="true"
              />
              <input
                id="animal-search"
                type="text"
                className="field-input pl-10 pr-10"
                placeholder="Search by name, tag number or breed"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-charcoal-500 transition hover:bg-charcoal-100 hover:text-charcoal-800"
                >
                  <FiX className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="sm:w-52">
              <label htmlFor="animal-type-filter" className="sr-only">
                Filter by animal type
              </label>
              <select
                id="animal-type-filter"
                className="field-input"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              >
                <option value="">All types</option>
                {ANIMAL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {ANIMAL_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {filtersActive && (
            <p className="text-sm text-charcoal-500" role="status">
              Showing {visibleAnimals.length} of {animals.length} animals
            </p>
          )}

          {visibleAnimals.length === 0 ? (
            <EmptyState
              icon={FiSearch}
              title="No animals match your search"
              description="Try a different name, tag number or breed, or clear the filters to see all your animals."
              action={
                <button type="button" onClick={clearFilters} className="btn btn-secondary">
                  Clear search and filters
                </button>
              }
            />
          ) : (
            <AnimalList animals={visibleAnimals} onEdit={openEdit} onDelete={openDelete} />
          )}
        </>
      )}

      {(dialog?.mode === 'create' || dialog?.mode === 'edit') && (
        <AnimalForm
          animal={dialog.mode === 'edit' ? dialog.animal : null}
          onClose={closeDialog}
          onSaved={handleSaved}
        />
      )}
      {dialog?.mode === 'delete' && (
        <DeleteAnimalDialog
          animal={dialog.animal}
          onCancel={closeDialog}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
