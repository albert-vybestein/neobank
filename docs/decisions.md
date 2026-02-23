# Decisions and Assumptions

## Assumptions
- The product prototype runs without external API dependencies in local development.
- Safe account connect and deploy flows use a local mock server interface that is swappable with real Safe Protocol integrations later.
- Contact submissions, analytics events, and order actions persist to local JSON files under `.data/`.
- Prediction market order stake defaults to `$100` in the current dashboard action flow.

## Architecture decisions
- API routes are implemented under `app/api/*` with Zod validation and lightweight IP based rate limiting.
- Client side forms validate before submission and display explicit loading, success, and error states.
- Dashboard data is served from `data/dashboard.json` through `/api/dashboard`, so UI rendering uses a real data fetch path rather than in-file constants.
- Motion components honor `prefers-reduced-motion` through both CSS and Framer Motion fallbacks.

## Swap points for production
- Replace `lib/server/safe-adapter.ts` with Safe Protocol Kit, module install, and bundler integrations.
- Replace JSON storage in `lib/server/json-store.ts` with database adapters.
- Route analytics from `/api/analytics/events` to a production analytics provider.
