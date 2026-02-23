# Decisions and Assumptions

## Assumptions
- The product prototype runs without external API dependencies in local development.
- Safe deployment supports two modes: `mock` for local development/tests, and `real` for Sepolia deployment with ERC-4337 via Pimlico by default (or relay mode when explicitly configured).
- Privy is used as the primary authentication layer for passkey and social login.
- If `NEXT_PUBLIC_PRIVY_APP_ID` is missing, sign in falls back to local injected-wallet mode for development.
- Contact submissions, analytics events, and order actions persist to local JSON files under `.data/`.
- Prediction market order stake defaults to `$100` in the current dashboard action flow.
- State-changing API routes enforce trusted-origin checks; loopback origins are allowed in non-production development for local testing.

## Architecture decisions
- API routes are implemented under `app/api/*` with Zod validation and lightweight IP based rate limiting.
- Safe owner authentication issues an httpOnly session cookie only after server-side Privy access-token verification and Safe owner checks.
- Session tokens are stored hashed at rest in local JSON state rather than plaintext.
- Client side forms validate before submission and display explicit loading, success, and error states.
- Dashboard data is served from `data/dashboard.json` through `/api/dashboard`, so UI rendering uses a real data fetch path rather than in-file constants.
- Motion components honor `prefers-reduced-motion` through both CSS and Framer Motion fallbacks.

## Swap points for production
- Replace file-based session storage with a database-backed session store.
- Replace JSON storage in `lib/server/json-store.ts` with database adapters.
- Route analytics from `/api/analytics/events` to a production analytics provider.
