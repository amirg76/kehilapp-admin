# Hardening notes — kehilapp-admin

## 1. Build was broken (fixed)

`npm run build` failed on a pre-existing TypeScript error: `handleDelete(id)` in
`src/components/dataTable/DataTable.tsx` declared a parameter it never used,
because the delete logic was left commented out. The build had been red before
this pass.

**Fix:** marked the parameter intentionally-unused (`_id`) so the build passes.
The delete flow itself is still not wired — that needs the backend DELETE
endpoint and is out of scope for a hardening pass. Flagged with a TODO rather
than faked.

## 2. Dependency vulnerabilities (reduced)

`npm audit`: **21 → 4** (15 high → 1). The one remaining high is in **vite**
(build-only tooling), which never ships to the browser.

## Known, still open

- Delete action in the data table is present in the UI but not functional.
- ESLint config may need the same refresh as the other repos after the dep bump.

## 3. Not wired to the backend (finding)

The dashboard renders static mock data from `src/data.ts`; every real API call is
commented out and points at `localhost:8800` (not the real backend on 5001). It is
a UI scaffold, not a connected client — so there was no auth flow to migrate to the
new httpOnly-cookie model. When it is wired up, it should reuse the same pattern as
the user app: `withCredentials: true` plus an `X-CSRF-Token` header (from the
readable `csrfToken` cookie) on mutating requests.
