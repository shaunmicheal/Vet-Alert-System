# VetAlert Zimbabwe — Frontend

React + Vite single-page application for VetAlert Zimbabwe. JavaScript/JSX only — no TypeScript.

## Stack

- React 19 + Vite
- React Router (routing + role guards)
- Tailwind CSS 4 (`@tailwindcss/vite`)
- Axios (centralised API client)
- React Hook Form + Zod (form validation)
- react-icons (icons)
- oxlint (linting)

## Getting started

1. Copy `.env.example` to `.env` and set the API location:

   ```
   VITE_API_URL=http://localhost:5000
   ```

   `VITE_API_URL` is the **only** frontend environment variable. Point it at the API
   origin; the Axios client appends `/api` automatically because the backend mounts
   every route under `/api` (for example `/api/auth/register`).

   Never put backend secrets (Gemini keys, JWT secrets, database URLs) in frontend
   env files.

2. Install and run:

   ```bash
   npm install
   npm run dev      # http://localhost:5173
   npm run build    # production build
   npm run lint     # oxlint
   ```

   The backend allows CORS from `http://localhost:5173` and `http://localhost:5174` in local development, plus any comma-separated origins set via `CLIENT_URL`.

## Structure

```
src/
  api/         # Axios client + endpoint functions
  components/  # Logo and shared UI (loading, alerts, empty states)
  context/     # Auth provider/context
  hooks/       # useAuth, useDocumentTitle
  layouts/     # AuthLayout (public pages), AppShell (authenticated shell)
  pages/       # Login, registration, 404, unauthorized, placeholders
  routes/      # AppRoutes + ProtectedRoute / PublicOnlyRoute
  utils/       # constants, storage, errors, navigation
  assets/      # static assets
```

## Design system

Shared design tokens and interface primitives live in `src/index.css`:

- **Colour** — `forest` (primary brand green), `cream` (warm ivory page
  backgrounds), `sage` (muted secondary surfaces such as section headers and
  table heads), `earth` (clay accents), `charcoal` (neutral ink), plus
  Tailwind's `amber` (restrained attention states) and `red` (errors and
  high-risk states only).
- **Layout tokens** — `--layout-sidebar`, `--layout-content` and
  `--layout-reading` drive `.page-container` and the `AppShell` sidebar.
- **Radii and elevation** — `--radius-card`, `--radius-control`,
  `--radius-sheet`, `--shadow-card`, `--shadow-raised`, `--shadow-overlay`.
- **Shared classes** — `.page-container`, `.page-eyebrow`, `.page-title`,
  `.page-lede`, `.card`, `.card-header`, `.card-hover`, `.badge`, `.btn`
  variants, `.field-*`, `.text-link`, `.toolbar`, `.table-wrap`, `.data-table`,
  `.dialog-panel`, `.dialog-icon`, `.section-eyebrow`.

Use these instead of introducing new colours or one-off spacing values. Base
styles also define the heading hierarchy, visible `:focus-visible` outlines and
a `prefers-reduced-motion` guard.

## Roles

`FARMER`, `VETERINARY_PROFESSIONAL` and `ADMIN` route to `/farmer`, `/vet` and
`/admin` respectively. Frontend guards are UX protection only — the backend
remains the real security boundary.

Only farmers can self-register; veterinary professionals and administrators are
created by the backend/admin.