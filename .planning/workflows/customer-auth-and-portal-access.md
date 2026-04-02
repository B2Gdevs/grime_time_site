# Customer Auth And Portal Access

## Why this exists

Grime Time now has two realities:

- the current repo still carries a Supabase-backed customer-auth implementation
- the product direction has changed to **full Clerk adoption** for hosted auth UI, social login, and identity

This workflow records the new target so future auth work does not keep extending the Supabase path by accident.

## Current state in repo

### Live checkpoint

The first Clerk slice is now active in repo:

- `src/proxy.ts` uses `clerkMiddleware()`
- `src/app/layout.tsx` is now the real root App Router layout and mounts `ClerkProvider` inside `<body>`
- marketing and `/login` now show Clerk-hosted sign-in/sign-up affordances plus `UserButton`
- server auth resolution checks Clerk first, then falls back to the older Supabase path
- Payload `users` now persist `clerkUserID` for app-side identity mapping
- claim-account completion can now accept a verified Clerk session and bind it onto the existing Payload user
- the shared claim/invite token screen now presents Clerk-first invite-aware copy, so company-access invites and direct account claims point users through the same hosted auth completion path
- direct `/forgot-password` and `/reset-password` now present Clerk-first recovery guidance when Clerk is configured instead of exposing the Supabase reset forms as the primary UX
- legacy `/auth/register` and `/auth/confirm` routes now short-circuit into the Clerk-first flow when Clerk is configured, instead of continuing to behave like the primary customer-auth entry points
- the active Clerk-first login, claim, forgot-password, reset-password, and signed-in nav surfaces no longer import Supabase browser helpers directly; the legacy Supabase customer-auth UI now lives behind fallback-only dynamic components and routes
- server-side customer identity now resolves through one shared helper, so Clerk-primary mode does not quietly reuse an old Supabase session when there is no Clerk session
- existing Payload admin users can now bind onto Clerk by email on first sign-in, which keeps the repo's own impersonation model viable without relying on Clerk's paid impersonation feature
- app-owned staff surfaces now resolve the Clerk-backed real actor first: `/ops`, portal docs, internal request-auth guards, and the frontend seed route no longer behave like Payload-session-first staff entry points

That means the app is now running with Clerk at the framework edge even though the full business-auth migration is not finished yet.

The existing implementation is still Supabase-shaped:

- public login UI: `src/app/(frontend)/login/page.tsx`
- dedicated claim-account UI: `src/app/(frontend)/claim-account/page.tsx`
- login/register form: `src/components/login-form.tsx`
- forgot-password page: `src/app/(frontend)/forgot-password/page.tsx`
- reset-password page: `src/app/(frontend)/reset-password/page.tsx`
- public registration route: `src/app/auth/register/route.ts`
- auth callback/logout routes: `src/app/auth/confirm/route.ts`, `src/app/auth/logout/route.ts`
- claim-account request/preview route: `src/app/api/auth/claim-account/route.ts`
- claim completion route: `src/app/api/auth/claim-account/complete/route.ts`
- company invite route: `src/app/api/portal/account/invitations/route.ts`
- Payload auth collection: `src/collections/Users/index.ts`
- current auth context: `src/lib/auth/getAuthContext.ts`
- request auth bridge: `src/lib/auth/requirePayloadUser.ts`
- Supabase helpers: `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`
- portal-access helpers: `src/lib/auth/portal-access/*`
- portal gate: `src/app/(portal)/layout.tsx`
- customer data surface: `src/lib/customers/getCustomerPortalData.ts`

Today:

- Clerk is the primary sign-in path when Clerk env is configured
- legacy Supabase customer-auth flows now exist as fallback-only code paths for non-Clerk environments and controlled migration cases
- claim-account and company invite flows bind Clerk identity back onto the existing Payload user
- Payload `users` still acts as the app-facing authorization/profile record
- app-owned staff/admin surfaces now use Clerk-first real identity, while Payload admin itself remains the transitional CMS/operator login surface

That is acceptable as the current implementation state, but it is no longer the desired end state.

## New product direction

### Identity provider

**Clerk is the identity layer for Grime Time.**

Use Clerk for:

- email/password auth
- social login
- passwordless / magic-link style flows where supported by the chosen Clerk setup
- session handling
- hosted login / signup / account components
- `UserButton` and related account chrome

### App-facing record

**Payload `users` remains the business/profile/authorization record.**

Use Payload `users` for:

- roles
- account/company relationship
- permissions and portal visibility
- staff versus customer scope
- CRM ownership links
- impersonation rules
- Stripe customer linkage

### External ids

Clerk and Stripe ids must both be first-class on the Grime Time side:

- `clerkUserId`
- `stripeCustomerId`

Those ids should map back into Payload `users` and, where needed, related account/customer records.

## UX direction

Use Clerk-hosted components as much as practical instead of rebuilding auth chrome:

- hosted sign-in
- hosted sign-up
- hosted account management where it fits
- Clerk `UserButton`
- social login buttons from Clerk configuration

The app should stop growing a parallel custom login UI unless a very specific product need is not covered by Clerk-hosted surfaces.

## Target architecture

### Clerk

Clerk owns:

- identity
- session cookies/tokens
- social login
- public auth screens
- core account-management affordances

### Payload `users`

Payload owns:

- role and authorization data
- account scope
- staff/customer flags
- operational metadata
- invite/claim token state
- app-specific preferences and business links

### Stripe

Stripe remains the billing system of record for payment rails, but its customer ids should be linked from the same user/account model that Clerk signs in.

That means:

- Clerk identity maps to Payload user
- Payload user maps to account/company scope
- Payload user and/or account maps to Stripe customer id

## Target request/session flow

`src/lib/auth/getAuthContext.ts` should move toward this:

1. resolve the current Clerk session
2. map Clerk identity to the matching Payload `users` record by `clerkUserId` first, then verified email only for controlled bootstrap/claim flows
3. load role, account, and staff/customer scope from Payload
4. preserve real-admin identity plus effective-user impersonation rules inside the app

The important boundary is:

- Clerk tells us **who is signed in**
- Payload tells us **what that user can do**

## Claim and invite model

Claim-account and company invites should stay one shared token model.

That means:

- existing-customer claim links and company invites still use one Payload token shape
- the acceptance surface should land in Clerk-hosted auth, not a separate custom auth system
- token completion binds the verified Clerk identity to the existing Payload user
- no duplicate Payload users when the invite/claim email already maps to an existing user

## Staff and admin direction

The long-term direction is to avoid a permanent split where customers use one auth stack and staff use another.

Open question for implementation:

- whether Payload admin stays as a narrow operator-only path during transition
- or whether Clerk becomes the upstream identity for both staff portal access and admin-adjacent app auth, with Payload admin bridged accordingly

For planning purposes, assume **Clerk is the primary identity standard**, even if some Payload-admin specifics remain transitional.

### Impersonation

Grime Time does **not** need Clerk's paid impersonation add-on for normal support/admin workflow.

The intended model is:

- Clerk owns the real signed-in identity
- Payload `users` and app cookies own effective-user impersonation state
- audit and portal access checks keep both the real actor and the impersonated subject visible in app logic

That means first-sign-in binding for existing admins matters: if a staff/admin email already exists in Payload, Clerk should attach to that record instead of creating a second customer-shaped user.

## Implementation slices

### Slice A: identity migration foundation

- add Clerk env/config
- add Clerk provider and middleware/session helpers
- add `clerkUserId` to Payload `users`
- add deterministic Payload-user lookup by Clerk identity
- keep Supabase path only as a migration fallback until cutover is complete

### Slice B: hosted auth surfaces

- replace custom login/signup emphasis with Clerk-hosted sign-in/sign-up
- adopt Clerk `UserButton` and account affordances in the portal/shell
- enable configured social providers

### Slice C: claim/invite bridge

- keep claim and company-invite tokens in Payload
- route accepted tokens through Clerk sign-in/sign-up
- bind the resulting Clerk user to the existing Payload user and account scope
- current checkpoint: the shared claim/invite token screen now supports Clerk-first copy and Clerk-backed completion; remaining work is removing the old Supabase-specific fallback UX once the team is comfortable with the cutover

### Slice D: Stripe and business identity linkage

- ensure `stripeCustomerId` is associated to the same Payload user/account records that Clerk resolves
- keep billing and portal checks keyed from app data, not directly from Clerk metadata alone

### Slice E: Supabase retirement

- remove Supabase auth screens/helpers once Clerk is fully wired
- keep only the database/storage pieces that still belong in Supabase/Postgres infrastructure
- current checkpoint: browser-side fallback forms are isolated into explicit `Supabase*` components and only loaded when Clerk is not the active customer-auth path
- current checkpoint: server-side claim completion and customer-user resolution now share the same Clerk-first identity helper, so fallback auth only runs when the server auth mode explicitly allows it

## Immediate planning implications

- future auth work should target **Clerk**, not extend the Supabase UX
- invite, portal, impersonation, and employee-tool work must assume a Clerk-backed real identity
- shared tool/auth work in phase `11` should be compatible with Clerk identities for field agents and staff

## Open product questions

- Do we want Clerk-hosted pages everywhere, or are there specific branded auth surfaces we still want to custom-wrap?
- Which social providers matter first for Grime Time: Google only, or Google plus Apple/Facebook?
- Do we want Clerk organizations, or will Grime Time continue to model company membership only in Payload accounts for v1?
- How much of Payload admin should stay on a transitional auth path versus moving behind the same Clerk-backed identity assumptions as the portal?
