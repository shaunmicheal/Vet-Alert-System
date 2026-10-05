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

   The backend allows CORS from `http://localhost:5173` by default.

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

## Roles

`FARMER`, `VETERINARY_PROFESSIONAL` and `ADMIN` route to `/farmer`, `/vet` and
`/admin` respectively. Frontend guards are UX protection only — the backend
remains the real security boundary.

Only farmers can self-register; veterinary professionals and administrators are
created by the backend/admin.