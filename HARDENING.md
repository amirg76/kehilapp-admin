# Hardening notes — kehilapp-admin

Two parts. **"Current state"** says what is true of the code today. The
**historical findings** below it are the notes of the first hardening pass
(August 2026), kept as written because they explain why the current code looks
the way it does — but several of them describe a repository that no longer
exists.

## Current state (October 2026)

- **Connected to the real API.** `src/api/kehilapp.ts` is the typed client for
  auth, messages, categories and users; `src/services/http.ts` is the axios
  layer; `src/auth/AuthContext.tsx` restores the session from `GET /api/auth/me`
  on mount and drops it on any later 401. There is no mock data and no
  `src/data.ts` — the file is gone, as is `src/components/dataTable/`. Both grids
  (`src/pages/messages/Messages.tsx`, `src/pages/users/Users.tsx`) render MUI
  DataGrid rows fetched with TanStack Query.
- **Session model is the resident app's.** `withCredentials: true` sends the
  httpOnly cookie; every POST/PUT/PATCH/DELETE carries `X-CSRF-Token` read from
  the `csrfToken` cookie (double-submit). The API base URL comes from
  `VITE_API_BASE_URL`; the old `localhost:8800` is nowhere in the tree, and a
  production build without the variable is refused by `vite.config.ts`.
- **Delete is functional** — and gated. The messages grid's "מחק" opens a
  confirm dialog that names the message (`Messages.tsx`, `pendingDelete`),
  and only the dialog's own button issues `DELETE /api/messages/:id`. The
  server enforces the admin role; the UI merely hides the action from members.
- **RBAC on users.** Approve, revoke, promote and demote each sit behind a
  confirm dialog; the server's refusals (your own account, the last admin, an
  admin's approval) are translated by HTTP status and request context, never by
  matching the server's English text.
- **Bidi-control defence.** `src/utils/plainText.ts` strips the twelve Unicode
  Bidi_Control code points from member- and admin-supplied text before it is
  rendered in a grid cell, a row-action label or the confirm dialog, so a name
  cannot render as a different name. `scripts/plain-text-check.mjs` checks that
  list against node's own Unicode tables and `scripts/no-raw-bidi.mjs` refuses
  any raw control character under `src/`; both run as `npm run check` locally
  (Node 22.18+), and the raw-bidi half runs in CI on Node 20.
- **Lint and CI exist.** `.eslintrc.cjs` is in place and `npm run lint` runs
  with `--max-warnings 0`. `.github/workflows/ci.yml` runs lint, `no-raw-bidi`
  and the build on every push and pull request, with actions pinned to commit
  SHAs.
- **Accessibility and RTL.** A MUI theme in both colour modes
  (`src/theme/index.ts`) replaced the themeless defaults that an axe scan had
  measured at 1.61:1 contrast; `dir="rtl"` on the document plus an emotion cache
  running `stylis-plugin-rtl` (`src/theme/rtlCache.ts`) mirrors MUI's physical
  CSS; MUI's Hebrew locale strings cover the grid chrome. Row actions carry
  real `aria-label`s, confirmations go to live regions.
- **Not re-measured in this pass:** `npm audit`. The numbers in historical
  section 2 are from August 2026 and should be re-run before being quoted.

## Historical findings (August 2026)

### 1. Build was broken (fixed)

`npm run build` failed on a pre-existing TypeScript error: `handleDelete(id)` in
`src/components/dataTable/DataTable.tsx` declared a parameter it never used,
because the delete logic was left commented out. The build had been red before
this pass.

**Fix at the time:** marked the parameter intentionally-unused (`_id`) so the
build passed. The delete flow itself was not wired then — it needed the backend
DELETE endpoint and was out of scope for a hardening pass. Flagged with a TODO
rather than faked. *(Since resolved: see "Current state". The file no longer
exists; delete is a real call behind a confirm dialog.)*

### 2. Dependency vulnerabilities (reduced)

`npm audit`: **21 → 4** (15 high → 1). The one remaining high was in **vite**
(build-only tooling), which never ships to the browser. *(Numbers as of
August 2026; not re-measured since.)*

### 3. Not wired to the backend (finding) — since resolved

At the time of the first pass the dashboard rendered static mock data from
`src/data.ts`; every real API call was commented out and pointed at
`localhost:8800` (not the real backend on 5001). It was a UI scaffold, not a
connected client — so there was no auth flow to migrate to the new
httpOnly-cookie model. The recommendation was that, when wired up, it should
reuse the same pattern as the user app: `withCredentials: true` plus an
`X-CSRF-Token` header (from the readable `csrfToken` cookie) on mutating
requests. *(Done exactly that way — see `src/services/http.ts` and "Current
state".)*

### Known, still open — as listed in August 2026

- ~~Delete action in the data table is present in the UI but not functional.~~
  Closed: functional, confirmed, admin-only.
- ~~ESLint config may need the same refresh as the other repos after the dep
  bump.~~ Closed: `.eslintrc.cjs` exists and runs clean at `--max-warnings 0`
  in CI.
