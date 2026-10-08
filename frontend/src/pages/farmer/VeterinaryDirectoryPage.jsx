import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FaUserMd } from 'react-icons/fa'
import { FiRefreshCw, FiSearch, FiShare2, FiX } from 'react-icons/fi'
import { getHealthReport } from '../../api/healthReports'
import { getVeterinaryDirectory } from '../../api/vets'
import CreateReferralDialog from '../../components/farmer/CreateReferralDialog'
import ProfessionalCard from '../../components/farmer/ProfessionalCard'
import AlertMessage from '../../components/ui/AlertMessage'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { ANIMAL_TYPE_LABELS, PROVINCES } from '../../utils/constants'
import { getApiErrorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'

const EMPTY_FILTERS = { search: '', province: '', district: '', professionalType: '' }

// Mirrors the backend directory query schema (backend/src/routes/vetDirectoryRoutes.js):
// search and district must be at least 2 characters, so we validate before sending
// instead of surfacing a backend 400 as an error card.
const MIN_FILTER_LENGTH = 2
const isSendable = (value) => value === '' || value.trim().length >= MIN_FILTER_LENGTH

// Farmer-facing veterinary directory. All data comes from the real backend
// (GET /api/vets) - read-only listing. When opened from a health report with
// ?report=<id> it also becomes the referral selection flow: the report is
// loaded (scoped to this farmer by the backend), the farmer picks a
// professional, and CreateReferralDialog handles message -> review -> submit.
export default function VeterinaryDirectoryPage() {
  useDocumentTitle('Veterinary Directory')

  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const referralReportId = searchParams.get('report') || ''

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
  // Referral mode state: the report being referred + the chosen professional.
  const [referralReport, setReferralReport] = useState(null)
  const [referralReportLoading, setReferralReportLoading] = useState(() =>
    Boolean(searchParams.get('report')),
  )
  const [referralReportError, setReferralReportError] = useState(null)
  const [selectedProfessional, setSelectedProfessional] = useState(null)
  // Monotonic id so a slow earlier response can never overwrite a newer one.
  const requestIdRef = useRef(0)

  // Loads the health report that ?report=<id> points at. The backend returns
  // 404 for a report that is not this farmer's - surfaced here as a banner.
  // State only changes inside promise callbacks (never synchronously) so the
  // mount effect cannot trigger cascading renders.
  const loadReferralReport = useCallback(() => {
    if (!referralReportId) return Promise.resolve()

    return getHealthReport(referralReportId)
      .then((data) => {
        setReferralReport(data)
        setReferralReportError(null)
      })
      .catch((error) => {
        setReferralReport(null)
        setReferralReportError(getApiErrorMessage(error))
      })
      .finally(() => {
        setReferralReportLoading(false)
      })
  }, [referralReportId])

  useEffect(() => {
    loadReferralReport()
  }, [loadReferralReport])

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

  // Exit referral mode and stay in the directory (removes ?report=<id>).
  const cancelReferralMode = () => {
    setSelectedProfessional(null)
    setReferralReport(null)
    setReferralReportError(null)
    setReferralReportLoading(false)
    setSearchParams({})
  }

  // Retry handler for the referral banner (event context, so loading may be set here).
  const retryReferralReport = () => {
    setReferralReportLoading(true)
    setReferralReportError(null)
    loadReferralReport()
  }

  // After a successful POST /referrals, confirm + jump to the status page.
  const handleReferralCreated = (referral) => {
    const name = referral.professional ? referral.professional.name : 'the professional'
    navigate(`/farmer/referrals/${referral.id}`, {
      state: { notice: `Your referral to ${name} has been sent. Track its status here.` },
    })
  }

  const referralMode = Boolean(referralReportId)
  const animalLabel = referralReport && referralReport.animal
    ? ANIMAL_TYPE_LABELS[referralReport.animal.animalType] || referralReport.animal.animalType
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">
          My Farm
        </p>
        <h1 className="mt-1 text-2xl font-bold text-charcoal-900">
          {referralMode ? 'Choose a veterinary professional' : 'Veterinary Directory'}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-charcoal-600">
          {referralMode
            ? 'Select the professional you would like to review this health report. You can add an optional message and review everything before the referral is sent.'
            : 'Find veterinary professionals who can help your farm. Search by name or specialisation, narrow down by province or district, and contact them directly.'}
        </p>
      </header>

      {/* Referral banner: which report is being shared, with an exit */}
      {referralMode && (
        <section className="card p-4 sm:p-5" aria-label="Health report being referred">
          {referralReportLoading ? (
            <p
              className="flex items-center gap-2 text-sm font-medium text-charcoal-600"
              role="status"
              aria-live="polite"
            >
              <Spinner className="h-4 w-4 text-forest-700" />
              Loading the health report you are referring…
            </p>
          ) : referralReportError ? (
            <AlertMessage variant="error" title="We couldn’t load that health report">
              <p>{referralReportError}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={retryReferralReport}
                  className="btn btn-secondary"
                >
                  <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
                  Try again
                </button>
                <button type="button" onClick={cancelReferralMode} className="btn btn-ghost">
                  Back to the directory
                </button>
              </div>
            </AlertMessage>
          ) : referralReport ? (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-forest-700">
                  <FiShare2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Referring health report
                </p>
                <p className="mt-1 font-semibold text-charcoal-900">{referralReport.title}</p>
                <p className="mt-0.5 text-sm text-charcoal-600">
                  {animalLabel ? `${animalLabel} · ` : ''}Submitted{' '}
                  {formatDate(referralReport.createdAt)}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-charcoal-500">
                  The professional will see this report&rsquo;s details, including its
                  AI-assisted risk assessment if one has been run — health guidance, not a
                  confirmed diagnosis.
                </p>
              </div>
              <button
                type="button"
                onClick={cancelReferralMode}
                className="btn btn-secondary shrink-0"
              >
                <FiX className="h-4 w-4" aria-hidden="true" />
                Cancel referral
              </button>
            </div>
          ) : null}
        </section>
      )}

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
            {referralMode ? ' — choose one to send this report to' : ''}
          </p>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {professionals.map((professional) => (
              <li key={professional.id}>
                <ProfessionalCard
                  professional={professional}
                  // In referral mode (and only once the report has loaded) each
                  // card gains a select action instead of staying read-only.
                  onSelect={
                    referralMode && referralReport && !referralReportLoading
                      ? setSelectedProfessional
                      : undefined
                  }
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Message -> review -> submit for the chosen professional */}
      {selectedProfessional && referralReport && (
        <CreateReferralDialog
          report={referralReport}
          professional={selectedProfessional}
          onCancel={() => setSelectedProfessional(null)}
          onCreated={handleReferralCreated}
        />
      )}
    </div>
  )
}