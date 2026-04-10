---
name: ops-customer-admin-app-owned-surface
description: >-
  Build `/portal/ops/customers` mutations behind one app-owned per-account API
  instead of separate Clerk or Stripe endpoints. Use this when adding customer
  account-link, portal-access, or billing-link cleanup so the ops UI stays
  stable even if providers change later.
---

# Ops customer admin app-owned surface

## When to use
- You are adding new actions to `/portal/ops/customers`.
- A customer-ops feature needs to touch account linkage, portal access, or Stripe customer repair.
- It is tempting to wire the page directly to provider-specific routes or dashboards.

## The pattern
- Keep the UI on one per-account POST endpoint: `/api/internal/ops/customers/[id]`.
- Back that route with one app-owned helper (`lib/ops/customerAdmin.ts`) using a discriminated `action` payload.
- Treat `accounts` as the durable record, then layer provider repair around it.
- Actions that fit this surface:
  - `set_primary_customer`
  - `clear_primary_customer`
  - `send_portal_access`
  - `clear_portal_access`
  - `clear_stripe_customer`
  - `repair_stripe_customer`
  - `resync_stripe_customer`
- Load the selected linked user first, assert it belongs to the account, then call app-owned helpers like `issuePortalAccess()` or `ensureStripeCustomer()`.
- Default stale-access normalization should be reissue (`send_portal_access`), not hard reset. Reserve `clear_portal_access` for explicit cleanup.
- Keep Stripe unlink, repair, and stale-id resync separate. `repair_stripe_customer` should preserve the normal helper behavior, while `resync_stripe_customer` should call the same helper with an explicit bypass of the current account-level `stripeCustomerID` so ops can recover from bad local ids without forcing a manual clear-first dance.

## Why
The ops UI should manage customer relationships from Grime Time's own account model, not from whichever provider happens to own email or payments today. A single app-owned customer-admin route keeps the page contract stable while hiding provider-specific recovery logic behind reusable helpers.

## Failure modes
- Directly calling Clerk or Stripe from the page leaks provider shape into the UI and makes later swaps expensive.
- Mutating linked users without asserting account ownership can silently cross-wire accounts.
- Repairing Stripe linkage without a fallback linked user reduces the quality of the customer record sent to Stripe.
- Treating `repair_stripe_customer` as a true stale-id correction path is unsafe when `ensureStripeCustomer()` still trusts `account.stripeCustomerID`; add a dedicated `resync_stripe_customer` action that bypasses the current account-level id instead of silently changing repair semantics for every caller.

## Related
- `staff-admin-clerk-role-preservation`
- `portal-ops-canonical-route-family`
