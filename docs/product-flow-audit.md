# Product Audit Update

## Objective
Clean up the neobank UX so it reads like a consumer bank product, not an integration console.

## Core findings
1. Integration-first UI was confusing in a consumer banking dashboard.
2. Product value was not obvious enough in feature naming.
3. Users needed clearer product outcomes tied to account behavior.

## Changes implemented
1. Removed integration-heavy language from core navigation and dashboard.
2. Replaced dashboard Integrations section with a consumer-facing Products section.
3. Added six financial products with clear value and policy behavior:
- Income Vault
- Goal Lock Pot
- Family Shared Wallet
- Subscription Guardian
- Travel Mode Wallet
- Market Guard Account
4. Product toggles now align account feature controls automatically.
5. Removed the integration registry route and kept product discovery inside the dashboard and product pages.
6. Kept advanced module mappings visible as supporting detail, not primary UX.

## Product design principle now in use
- Primary language: outcomes for people
- Secondary language: controls and safeguards
- Tertiary language: module mapping

## Validation
- lint: pass
- typecheck: pass
- tests (unit/integration/e2e): pass
- build: pass
