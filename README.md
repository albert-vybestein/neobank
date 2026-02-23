# NEOBANK Production-Grade Prototype

Multi-page Next.js App Router website prototype for a global neobank experience with real wired flows.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
`npm run dev` uses Turbopack for faster local iteration. If you need webpack compatibility, use `npm run dev:webpack`.

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
| `SAFE_DEPLOY_MODE` | No | `mock` | `real` deploys Safe on Sepolia, `mock` keeps local simulation |
| `SAFE_DEPLOY_STRATEGY` | No | `erc4337` if no relayer key, else `relay` | `erc4337` deploys from browser wallet via Pimlico, `relay` uses server relayer |
| `SAFE_RPC_URL` | Recommended in real mode | Public Sepolia RPC fallback | Sepolia RPC URL used for owner checks and relay deploy path |
| `PIMLICO_RPC_URL` | Optional | - | Server-side Pimlico RPC URL fallback for owner checks |
| `SAFE_RELAYER_PRIVATE_KEY` | Relay mode only | - | Funded testnet relayer key used only when `SAFE_DEPLOY_STRATEGY=relay` |
| `NEXT_PUBLIC_SAFE_WALLET_MODE` | No | `real` | `real` uses browser wallet signatures, `mock` enables local no-wallet sign in |
| `NEXT_PUBLIC_SAFE_DEPLOY_STRATEGY` | No | `erc4337` if Pimlico URL is set | Frontend deploy path selector (`erc4337` or `relay`) |
| `NEXT_PUBLIC_PIMLICO_RPC_URL` | Recommended for 4337 mode | - | Pimlico bundler/paymaster RPC URL for sponsored user operations |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Recommended | - | Privy App ID for client-side auth UI (passkey + social + wallet) |
| `NEXT_PUBLIC_PRIVY_CLIENT_ID` | Optional | - | Privy client ID for client SDK initialization |
| `NEXT_PUBLIC_PRIVY_LOGIN_METHODS` | Optional | unset | Comma-separated method allowlist to force in UI, e.g. `wallet,passkey,google,twitter` |
| `PRIVY_APP_ID` | Recommended for non-mock session auth | - | Privy App ID used by server-side token verification |
| `PRIVY_APP_SECRET` | Recommended for non-mock session auth | - | Privy App Secret used by `@privy-io/node` |
| `PRIVY_VERIFICATION_KEY` | Optional | - | Optional static JWT verification key override from Privy dashboard |

Create `.env.local` if you want to override defaults.

### Real testnet setup with Privy + Pimlico (no relayer)

To deploy real Safe accounts on Sepolia with ERC-4337 sponsorship and verify login using Privy:

```bash
SAFE_DEPLOY_MODE=real
SAFE_DEPLOY_STRATEGY=erc4337
SAFE_RPC_URL=https://your-sepolia-rpc
PIMLICO_RPC_URL=https://public.pimlico.io/v2/11155111/rpc
NEXT_PUBLIC_SAFE_WALLET_MODE=real
NEXT_PUBLIC_SAFE_DEPLOY_STRATEGY=erc4337
NEXT_PUBLIC_PIMLICO_RPC_URL=https://public.pimlico.io/v2/11155111/rpc
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_PRIVY_CLIENT_ID=your_privy_client_id
NEXT_PUBLIC_PRIVY_LOGIN_METHODS=wallet,passkey,google,twitter
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret
```

### Relay mode (optional fallback)

```bash
SAFE_DEPLOY_MODE=real
SAFE_DEPLOY_STRATEGY=relay
SAFE_RPC_URL=https://your-sepolia-rpc
SAFE_RELAYER_PRIVATE_KEY=0xYOUR_FUNDED_TESTNET_KEY
NEXT_PUBLIC_SAFE_WALLET_MODE=real
NEXT_PUBLIC_SAFE_DEPLOY_STRATEGY=relay
```

For local no-wallet mode (tests and demos):

```bash
SAFE_DEPLOY_MODE=mock
NEXT_PUBLIC_SAFE_WALLET_MODE=mock
```

If `NEXT_PUBLIC_PRIVY_APP_ID` is not set, the sign in modal automatically falls back to local injected-wallet connect mode for local testing.
If you see `Login with <method> not allowed`, enable that method in your Privy app settings and add it to `NEXT_PUBLIC_PRIVY_LOGIN_METHODS`.

## Implemented routes

- `/`
- `/dashboard`
- `/product`
- `/security`
- `/how-it-works`
- `/pricing`
- `/company`
- `/legal/terms`
- `/legal/privacy`
- `/legal/disclosures`
- `app/not-found.tsx` custom 404

## API routes

- `POST /api/safe/connect`
- `POST /api/safe/deploy`
- `POST /api/safe/deploy/register`
- `GET /api/safe/by-owner`
- `POST /api/contact`
- `POST /api/analytics/events`
- `GET /api/dashboard`
- `POST /api/trading/orders`
- `POST /api/predictions/orders`
- `POST /api/auth/challenge`
- `POST /api/auth/verify`
- `POST /api/auth/privy-session`
- `POST /api/auth/mock-session`
- `GET /api/auth/session`
- `POST /api/auth/logout`

All write endpoints include server-side validation, trusted-origin checks, and lightweight rate limiting.

## What is implemented

- [x] Shared layout with sticky nav, active-link highlighting, mobile menu
- [x] Fully wired sign-in flow with connect, account setup, feature activation, deploy, and dashboard handoff
- [x] Privy-based authentication flow with passkey, social login, and secure session cookie
- [x] Server-side Privy token verification with wallet ownership checks before session issuance
- [x] Session tokens are stored hashed at rest in local storage and validated on every authenticated route
- [x] Global security headers via middleware (CSP, frame protections, referrer policy, no-sniff, permissions policy)
- [x] CSRF-oriented origin checks on state-changing API routes with loopback-safe dev behavior
- [x] Dashboard route and trading actions gated by authenticated Safe owner session
- [x] Real contact form flow with client + server validation, loading/success/error states, and honeypot field
- [x] Dashboard powered by `GET /api/dashboard` with live fetch path and fallback
- [x] Trading order and prediction order actions wired to real API routes with stateful UI feedback
- [x] CTA event tracking via `POST /api/analytics/events`
- [x] Responsive behavior across pages
- [x] Reduced-motion fallbacks for key motion components
- [x] Dashboard products section centered on consumer outcomes instead of provider internals
- [x] Module-powered financial products with clear controls and value explanations
- [x] SEO basics: metadata, robots, sitemap
- [x] Unit, integration, and e2e test suites included

## Strategy implementation from report

Prioritized from the strategy document for fast MVP:

1. Fiat account rails and vIBAN workflows (highest UX impact)
2. Card controls and spend experiences
3. Account feature products powered by Safe, Gnosis Guild, and Rhinestone controls
4. Managed investing, market access, and prediction products with policy safeguards

Current productized features include:

- Income Vault
- Goal Lock Pot
- Family Shared Wallet
- Subscription Guardian
- Travel Mode Wallet
- Market Guard Account

## Testing

- Unit tests: math, validation, rate limit logic
- Integration tests: API routes for contact, safe connect/deploy, trading and prediction orders
- E2E tests: landing load, nav routing, sign-in flow, contact submit, mobile smoke, reduced-motion smoke

## Known limitations

- For real deployments, the recommended path is ERC-4337 via Pimlico (`NEXT_PUBLIC_PIMLICO_RPC_URL`) with no relayer key.
- Relay mode remains available when explicitly selected.
- Persistent storage is file-based JSON in local development (`.data/`).
- Rate limiting is in-memory per process and should be moved to Redis or equivalent for multi-instance production.

## Assumptions

See `docs/decisions.md`.
