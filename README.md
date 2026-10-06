# Kehilapp — Admin Panel

[![CI](https://github.com/amirg76/kehilapp-admin/actions/workflows/ci.yml/badge.svg)](https://github.com/amirg76/kehilapp-admin/actions/workflows/ci.yml)

The admin panel for the **Kehilapp community board**: messages, members and
member approval, for the administrators of one evacuated kibbutz community.
Hebrew, right-to-left, React + TypeScript + MUI.

> Part of a 3-tier system: [kehilapp-backend](https://github.com/amirg76/kehilapp-backend) (API) ·
> [kehilapp-front](https://github.com/amirg76/kehilapp-front) (resident app) ·
> **kehilapp-admin (this repo)** · [kehilapp-devops](https://github.com/amirg76/kehilapp-devops) (Docker, proxy, server)

**Live demo:** coming soon — see [kehilapp-devops](https://github.com/amirg76/kehilapp-devops) for how the stack is deployed.

## Why this exists, and when

Kehilapp was built after October 7th to replace the daily flood of WhatsApp
messages in an evacuated kibbutz with one organised board. This panel started
as a 2024 pilot — a dashboard template with mock data — and was **rebuilt
between August and October 2026** as part of a hardening and portfolio effort
across the three Kehilapp repos: wired to the real API, given a real session
model, and brought up to the same security and accessibility bar as the
resident app. [HARDENING.md](HARDENING.md) records what was found and what was
changed, including the parts that are history now.

## What is notable

- **Cookie session + CSRF, same pattern as the resident app.** `src/services/http.ts`
  sends the httpOnly auth cookie (`withCredentials`) and echoes the readable
  `csrfToken` cookie back as `X-CSRF-Token` on every mutating request. The JWT
  never touches JavaScript or `localStorage`.
- **RBAC is enforced server-side.** The UI hides what a member may not do;
  the API refuses it regardless. The panel treats a 401 as a dead session and
  drops to the login screen (`src/auth/AuthContext.tsx`).
- **Admin approval of members.** Email verification and admission are two
  separate decisions; the users grid approves, revokes, promotes and demotes,
  each behind a confirm dialog, with the server's refusals (last admin, your
  own account) translated by status, not by echoing server text.
- **Messages: create, edit, delete.** Delete sits behind a confirm dialog
  that names the message; the server enforces the admin role.
- **AI category + urgency suggestion.** The compose form asks the backend's
  Anthropic-backed `POST /api/messages/classify` for a suggested category and
  urgency. Advisory only — it fills two fields and the admin still publishes
  by hand. When the server has no API key (503) the button simply disappears.
- **Real RTL.** `dir="rtl"` on the document, a MUI theme with `direction: "rtl"`
  and Heebo as the Hebrew face, plus an emotion cache running
  `stylis-plugin-rtl` so MUI's own physical CSS is mirrored
  (`src/theme/rtlCache.ts`). MUI's Hebrew locale strings for the grid chrome.
- **Bidi-control hygiene.** Member- and admin-supplied text is stripped of the
  twelve Unicode bidi control characters before it reaches a grid cell
  (`src/utils/plainText.ts`), and `npm run check` fails the build if a raw one
  is ever committed into `src/`.
- **Strict toolchain.** TypeScript `strict`, ESLint with `--max-warnings 0`,
  and a CI workflow that runs lint, the raw-bidi check and the build on every
  push and pull request.
- **Served under a path.** `VITE_BASE_PATH=/admin/` sets both Vite's asset base
  and the router's basename from one value; the reverse proxy in
  kehilapp-devops mounts the panel at `/admin`.

## Running it

Requires Node 20+ (Node 22.18+ for `npm run check`, whose `plain-text-check`
imports a `.ts` module directly) and a running
[kehilapp-backend](https://github.com/amirg76/kehilapp-backend). The panel is
a client only — nothing works without the API.

```bash
npm ci
VITE_API_BASE_URL=http://localhost:5001 npm run dev    # http://localhost:3001
```

Or copy `.env.example` to `.env` (it holds the same variable). The backend must
list the panel's origin (`http://localhost:3001`) in its `ALLOWED_ORIGINS`,
because the session cookie is sent cross-origin.

**Demo admin credentials:** printed by the backend's seed script
(`scripts/seedDemo.js` in kehilapp-backend) each time it runs. They are
generated per run and are never in any repository.

### Environment variables

| Variable | Required | Meaning |
|---|---|---|
| `VITE_API_BASE_URL` | yes for `build` | Origin of the API. `""` (empty) means **same origin** — the proxy routes `/api` to the backend. A production build without this variable is **refused** (`vite.config.ts`), because the dev fallback would be baked into the bundle. |
| `VITE_BASE_PATH` | no | Where the panel is served from. Default `/`; the deployment builds with `/admin/`. |

```bash
# the two builds the deployment and CI actually make
VITE_API_BASE_URL="" VITE_BASE_PATH=/ npm run build
VITE_API_BASE_URL="" VITE_BASE_PATH=/admin/ npm run build
```

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on port 3001 |
| `npm run lint` | ESLint over `src`, zero warnings allowed |
| `npm run check` | `plain-text-check` (the bidi strip against node's Unicode tables) + `no-raw-bidi` (no raw bidi control character under `src/`) |
| `npm run build` | `tsc` then `vite build` |

## Tech stack

React 18 · TypeScript · Vite · MUI 5 + MUI X Data Grid · TanStack Query ·
React Router 6 · axios · Sass · `stylis-plugin-rtl`

## Related

- [HARDENING.md](HARDENING.md) — the hardening findings, what was fixed, and the current state.
- [kehilapp-backend](https://github.com/amirg76/kehilapp-backend) — the API, the auth model, the seed script.
- [kehilapp-front](https://github.com/amirg76/kehilapp-front) — the resident-facing app that shares the session pattern.
- [kehilapp-devops](https://github.com/amirg76/kehilapp-devops) — Docker images, reverse proxy, server and runbooks.
