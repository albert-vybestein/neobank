# NEOBANK Production-Grade Prototype

Multi-page Next.js App Router website prototype for a global neobank experience with real wired flows.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test
npm run build
npm run start
```

## Environment variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | No | `https://neobank.example` | Metadata base URL for OG, robots, sitemap |
| `NEOBANK_DATA_DIR` | No | `<repo>/.data` | Local JSON storage path for submissions/events/orders |

Create `.env.local` if you want to override defaults.

## Implemented routes

- `/`
- `/dashboard`
- `/product`
- `/security`
- `/how-it-works`
- `/pricing`
- `/company`
- `/developers`
- `/legal/terms`
- `/legal/privacy`
- `/legal/disclosures`
- `app/not-found.tsx` custom 404

## API routes

- `POST /api/safe/connect`
- `POST /api/safe/deploy`
- `POST /api/contact`
- `POST /api/analytics/events`
- `GET /api/dashboard`
- `POST /api/trading/orders`
- `POST /api/predictions/orders`

All write endpoints include server-side validation. User-facing submit endpoints include lightweight rate limiting.

## What is implemented

- [x] Shared layout with sticky nav, active-link highlighting, mobile menu
- [x] Fully wired sign-in flow with connect, account setup, feature activation, deploy, and dashboard handoff
- [x] Real contact form flow with client + server validation, loading/success/error states, and honeypot field
- [x] Dashboard powered by `GET /api/dashboard` with live fetch path and fallback
- [x] Trading order and prediction order actions wired to real API routes with stateful UI feedback
- [x] CTA event tracking via `POST /api/analytics/events`
- [x] Responsive behavior across pages
- [x] Reduced-motion fallbacks for key motion components
- [x] SEO basics: metadata, robots, sitemap
- [x] Unit, integration, and e2e test suites included

## Testing

- Unit tests: math, validation, rate limit logic
- Integration tests: API routes for contact, safe connect/deploy, trading and prediction orders
- E2E tests: landing load, nav routing, sign-in flow, contact submit, mobile smoke, reduced-motion smoke

## Known limitations

- Safe connect/deploy currently uses a local adapter (`lib/server/safe-adapter.ts`) with deterministic mock addresses and transaction hashes. It is structured for replacement with real Safe stack integrations.
- Persistent storage is file-based JSON in local development (`.data/`).

## Assumptions

See `docs/decisions.md`.
