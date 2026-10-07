import { useCallback, useEffect, useRef, useState } from 'react'
import { FaUserMd } from 'react-icons/fa'
import { FiRefreshCw, FiSearch, FiX } from 'react-icons/fi'
import { getVeterinaryDirectory } from '../../api/vets'
import ProfessionalCard from '../../components/farmer/ProfessionalCard'
import AlertMessage from '../../components/ui/AlertMessage'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { PROVINCES } from '../../utils/constants'
import { getApiErrorMessage } from '../../utils/errors'

const EMPTY_FILTERS = { search: '', province: '', district: '', professionalType: '' }

// Mirrors the backend directory query schema (backend/src/routes/vetDirectoryRoutes.js):
// search and district must be at least 2 characters, so we validate before sending
// instead of surfacing a backend 400 as an error card.
const MIN_FILTER_LENGTH = 2
const isSendable = (value) => value === '' || value.trim().length >= MIN_FILTER_LENGTH

// Farmer-facing veterinary directory. All data comes from the real backend
// (GET /api/vets) - read-only, with no referral actions in this phase.
export default function VeterinaryDirectoryPage() {
  useDocumentTitle('Veterinary Directory')

  const [professionals, setProfessionals] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [searchText, setSearchText] = useState('')
  // District is edited as draft text and only committed on blur, so typing never
  // fires one request per keystroke (or sends a too-short value to the backend).
  const [districtText, setDistrictText] = useState('')
  const [filterHint, setFilterHint] = useState(null)
  // Captured from the unfiltered list so the role filter keeps every option.
  const [typeOptions, setTypeOptions] = useState([])
  // Monotonic id so a slow earlier response can never overwrite a newer one.
  const requestIdRef = useRef(0)

  // Promise-chain style (like the other farmer pages) so setState never runs
  // synchronously inside the mount effect.
  const loadDirectory = useCallback(() => {
    const requestId = ++requestIdRef.current
    const params = {}
    // Defence in depth: never send a value the backend schema would reject.
    if (isSendable(filters.search) && filters.search) params.search = filters.search
    if (filters.province) params.province = filters.province
    if (isSendable(filters.district) && filters.district) params.district = filters.district
    if (filters.professionalType) params.professionalType = filters.professionalType

    return getVeterinaryDirectory(params)
      .then((list) => {
        if (requestId !== requestIdRef.current) return
        setProfessionals(list)
        setLoadError(null)

        if (!params.search && !params.province && !params.district && !params.professionalType) {
          const types = [...new Set(list.map((item) => item.professionalType).filter(Boolean))].sort()
          setTypeOptions(types)
        }
      })
      .catch((error) => {
        if (requestId !== requestIdRef.current) return
        setLoadError(getApiErrorMessage(error))
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return
        setLoading(false)
      })
  }, [filters])

  const reloadDirectory = () => {
    setLoading(true)
    setLoadError(null)
    loadDirectory()
  }

  useEffect(() => {
    loadDirectory()
  }, [loadDirectory])

  // Filter changes happen in event handlers, so the loading state can be set here.
  const applyFilter = (key, value) => {
    setFilterHint(null)
    setLoading(true)
    setFilters((previous) => ({ ...previous, [key]: value }))
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    const term = searchText.trim()
    // The backend rejects search terms under 2 characters - explain instead of
    // showing a generic error card.
    if (!isSendable(term)) {
      setFilterHint('Please enter at least 2 characters to search.')
      return
    }
    applyFilter('search', term)
  }

  // District commits on blur only (draft text lives in districtText).
  const commitDistrict = () => {
    const value = districtText.trim()
    if (value === filters.district) return
    if (!isSendable(value)) {
      setFilterHint('District must be at least 2 characters.')
      return
    }
    applyFilter('district', value)
  }

  const clearFilters = () => {
    setSearchText('')
    setDistrictText('')
    setFilterHint(null)
    // Only touch `filters` when a committed filter actually changes - setting the
    // same EMPTY_FILTERS reference would bail out of the effect and leave the
    // spinner stuck on when only draft text was active.
    if (Object.values(filters).some((value) => value !== '')) {
      setLoading(true)
      setFilters(EMPTY_FILTERS)
    }
  }

  // Committed filters plus any draft text still being typed.
  const filtersActive =
    Object.values(filters).some((value) => value !== '') ||
    searchText.trim() !== '' ||
    districtText.trim() !== ''
  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">
          My Farm
        </p>
        <h1 className="mt-1 text-2xl font-bold text-charcoal-900">Veterinary Directory</h1>
        <p className="mt-1 max-w-2xl text-sm text-charcoal-600">
          Find veterinary professionals who can help your farm. Search by name or specialisation,
          narrow down by province or district, and contact them directly.
        </p>
      </header>

      {/* Filters */}
      <section
        aria-label="Search and filter the veterinary directory"
        className="card p-4 sm:p-5"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <form onSubmit={handleSearchSubmit} className="lg:col-span-2">
            <label htmlFor="vet-search" className="field-label">
              Search
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <FiSearch
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400"
                  aria-hidden="true"
                />
                <input
                  id="vet-search"
                  type="text"
                  className="field-input pl-10"
                  placeholder="Name, specialisation or location"
                  value={searchText}
                  onChange={(event) => {
                    setSearchText(event.target.value)
                    if (filterHint) setFilterHint(null)
                  }}
                />
              </div>
              <button type="submit" className="btn btn-primary shrink-0">
                Search
              </button>
            </div>
          </form>

          <div>
            <label htmlFor="vet-province" className="field-label">
              Province
            </label>
            <select
              id="vet-province"
              className="field-input"
              value={filters.province}
              onChange={(event) => applyFilter('province', event.target.value)}
            >
              <option value="">All provinces</option>
              {PROVINCES.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="vet-type" className="field-label">
              Role
            </label>
            <select
              id="vet-type"
              className="field-input"
              value={filters.professionalType}
              onChange={(event) => applyFilter('professionalType', event.target.value)}
            >
              <option value="">All roles</option>
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="vet-district" className="field-label">
              District
            </label>
            <input
              id="vet-district"
              type="text"
              className="field-input"
              placeholder="e.g. Mutare"
              value={districtText}
              onChange={(event) => {
                setDistrictText(event.target.value)
                if (filterHint) setFilterHint(null)
              }}
              onBlur={commitDistrict}
            />
          </div>
        </div>

        {filterHint && (
          <p className="mt-4 text-sm font-medium text-amber-700" role="status">
            {filterHint}
          </p>
        )}

        {filtersActive && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-charcoal-100 pt-3">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline"
            >
              <FiX className="h-4 w-4" aria-hidden="true" />
              Clear all filters
            </button>
          </div>
        )}
      </section>

      {/* Results */}
      {loading ? (
        <div
          className="card flex items-center justify-center gap-3 px-6 py-16"
          role="status"
          aria-live="polite"
        >
          <Spinner className="h-6 w-6 text-forest-700" />
          <p className="text-sm font-medium text-charcoal-600">Loading professionals…</p>
        </div>
      ) : loadError ? (
        <AlertMessage variant="error" title="We couldn’t load the veterinary directory">
          <p>{loadError}</p>
          <button type="button" onClick={reloadDirectory} className="btn btn-secondary mt-3">
            <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </AlertMessage>
      ) : professionals.length === 0 ? (
        <EmptyState
          icon={FaUserMd}
          title="No veterinary professionals found."
          description="Try another province or district, or search using a different name or specialisation."
          action={
            filtersActive ? (
              <button type="button" onClick={clearFilters} className="btn btn-secondary">
                Clear all filters
              </button>
            ) : null
          }
        />
      ) : (
        <>
          <p className="text-sm text-charcoal-500" role="status">
            Showing {professionals.length} professional{professionals.length === 1 ? '' : 's'}
          </p>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {professionals.map((professional) => (
              <li key={professional.id}>
                <ProfessionalCard professional={professional} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}