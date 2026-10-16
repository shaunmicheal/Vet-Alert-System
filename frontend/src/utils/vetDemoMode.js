/**
 * Veterinary demonstration-mode helpers (Phase 3).
 *
 * Context
 * -------
 * The backend `VeterinaryProfessional` model has no dedicated flag that marks a
 * record as a demonstration profile versus a real participating professional.
 * The farmer-facing directory API (`GET /vets`) also omits `userId`, so the
 * browser cannot tell whether a profile is linked to a login account.
 *
 * What this module does
 * ----------------------
 * - Exposes a single public UI flag, `VET_DEMO_MODE_ENABLED`, that only
 *   controls labelling and explanatory copy. It never controls authorization
 *   or server-side security; referral ownership checks and role guards are
 *   unchanged.
 * - Provides `isDemoProfessional()`, a clearly-documented heuristic that
 *   treats the seeded development records (reserved `@example.com` emails and
 *   obvious `77 000` dummy phone digits, per `backend/prisma/seed.js`) as
 *   demonstration profiles. This is intentionally conservative and labelled as
 *   a heuristic until the backend gains a real `isDemo`/`source` column.
 *
 * Required follow-up (deliberately NOT done in Phase 3)
 * ------------------------------------------------------
 * Add an additive `VeterinaryProfessional.isDemo Boolean @default(false)` (or a
 * `source` enum) via a Prisma migration, backfill existing `@example.com`
 * records, and expose it through `PUBLIC_PROFESSIONAL_SELECT`. That gives the
 * frontend a reliable signal instead of this heuristic.
 */

const RAW_FLAG =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_VET_DEMO_MODE
    : undefined

/**
 * Public UI-only flag. Defaults to true so a stakeholder demo can never
 * silently present simulated profiles as real professionals. Set
 * `VITE_VET_DEMO_MODE=false` in the environment to hide demo labelling once
 * real, verified professionals are listed (after the backend distinction above
 * exists). This flag has no effect on authentication, role guards, or API
 * permissions.
 */
export const VET_DEMO_MODE_ENABLED = String(RAW_FLAG ?? 'true').toLowerCase() !== 'false'

export const DEMO_EMAIL_DOMAIN = '@example.com'

const DEMO_PHONE_PATTERN = /77\s?000\s?00|000\s?000/i

const normaliseEmail = (email) => String(email || '').trim().toLowerCase()

/**
 * Returns true when a directory record looks like one of the seeded fictional
 * profiles. Requires the global demo flag to be on AND at least one seed
 * marker (reserved demo email domain or obvious dummy phone digits).
 * Never infers anything from a person's display name.
 */
export const isDemoProfessional = (professional) => {
  if (!VET_DEMO_MODE_ENABLED) return false
  if (!professional || typeof professional !== 'object') return false
  const email = normaliseEmail(professional.email)
  const phone = String(professional.phone || '')
  if (email.endsWith(DEMO_EMAIL_DOMAIN)) return true
  if (phone && DEMO_PHONE_PATTERN.test(phone)) return true
  return false
}

export const VET_DEMO_DIRECTORY_MESSAGE =
  'Demonstration mode: veterinary profiles and referral responses are simulated. No real veterinary professional is contacted.'

export const VET_DEMO_REFERRAL_MESSAGE =
  'This referral stays inside the demonstration. Selecting a demonstration profile does not notify or contact a real veterinary professional.'

export const VET_DEMO_RESPONSE_NOTE =
  'Simulated response for demonstration purposes only. This is not advice from a real veterinary professional.'

export const VET_URGENT_CARE_GUIDANCE =
  'For urgent, worsening, or high-risk livestock-health concerns, contact an appropriate real veterinary professional or your local animal-health authority directly. Do not wait on a demonstration referral.'
