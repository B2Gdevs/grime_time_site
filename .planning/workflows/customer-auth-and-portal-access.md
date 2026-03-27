# Customer Auth And Portal Access

## Why this exists

Customer access is still using Payload's built-in email/password login, but the product direction now requires:

- easy customer sign-in
- email/password as a supported path
- passwordless sign-in with one-time magic links
- forgot-password and reset-password flows
- clean account claiming for existing customers and company users
- customer data visibility that stays tied to the correct account/company scope

This workflow defines the target auth model and the gaps that still block a polished customer experience.

## Current state in repo

- Public login UI: `src/app/(frontend)/login/page.tsx`
- Dedicated claim-account UI: `src/app/(frontend)/claim-account/page.tsx`
- Login/register form: `src/components/login-form.tsx`
- Forgot-password page: `src/app/(frontend)/forgot-password/page.tsx`
- Reset-password page: `src/app/(frontend)/reset-password/page.tsx`
- Public registration route: `src/app/auth/register/route.ts`
- Supabase confirm callback: `src/app/auth/confirm/route.ts`
- Supabase logout route: `src/app/auth/logout/route.ts`
- Claim-account request/preview route: `src/app/api/auth/claim-account/route.ts`
- Claim completion route: `src/app/api/auth/claim-account/complete/route.ts`
- Company invite route: `src/app/api/portal/account/invitations/route.ts`
- Payload auth collection: `src/collections/Users/index.ts`
- Current auth context: `src/lib/auth/getAuthContext.ts`
- Request auth bridge: `src/lib/auth/requirePayloadUser.ts`
- Supabase helpers: `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`
- Portal-access helpers: `src/lib/auth/portal-access/*`
- Portal gate: `src/app/(portal)/layout.tsx`
- Customer data surface: `src/lib/customers/getCustomerPortalData.ts`
- Company-access surface: `src/app/(portal)/account/page.tsx`, `src/components/portal/CustomerCompanyAccessCard.tsx`, `src/components/portal/CustomerCompanyInviteForm.tsx`

Today:

- customers can sign in with Supabase email/password
- customers can request a one-time magic link
- customers can request a password-reset email and land on a reset page
- portal access can now resolve a customer from Supabase Auth back into a Payload `users` record by verified email
- a missing Payload customer user is auto-created on first verified Supabase login
- existing CRM customers can now request or complete a claim link from `/claim-account`
- company accounts can now issue account-scoped invite links from the account surface
- staff/admin auth still remains on Payload auth
- quote/invoice/schedule emails still do not generate claim CTAs automatically
- company invite authority currently uses the primary company contact or matching billing email, not a separate dedicated company-admin role

The current implementation target is to solve both gaps with one shared token model:

- claim-account requests for existing CRM customers
- company-user invites from an account surface
- the same dedicated `/claim-account` route consuming either path

## Product requirements

### Customer-facing auth

Support all of these:

1. Email + password sign-in
2. Magic-link sign-in
3. Forgot-password email
4. Reset-password page
5. New customer account creation
6. Existing-customer account claim from a quote / invoice / invite email
7. Company-user invite acceptance without exposing admin screens

### Customer-facing access

After auth, customers should be able to:

- view estimates / quotes tied to them or their company account
- view invoices and payment links
- view appointments and recurring-plan status
- update contact info and addresses
- manage payment method links through Stripe portal when enabled

### UX expectations

- keep login compact and obvious
- avoid social login for now
- make passwordless a first-class option, not buried
- use tabs / button groups / compact help text instead of long copy blocks
- keep company users and residential users on the same basic auth surface, with differences handled by account scope after login

## Recommended auth architecture

### Split auth by audience

- Staff/admin auth stays on Payload auth and `/admin/login`
- Customer/public auth moves to Supabase Auth

This split is the cleanest way to support magic links and password reset without forcing customer auth to live inside the admin/session model that currently powers Payload.

## Why Supabase Auth is the right customer auth layer

Supabase already supports:

- email/password auth
- magic-link login via `signInWithOtp`
- password reset via `resetPasswordForEmail`
- password update after reset via `updateUser`

Official references:

- Magic-link / passwordless email: `https://supabase.com/docs/guides/auth/auth-email-passwordless`
- Password auth + reset flow: `https://supabase.com/docs/guides/auth/passwords`

Important operational note:

- Supabase's built-in email sender is limited for production use; production should use custom SMTP
- Resend should be configured as the SMTP provider for Supabase Auth emails

## Target system-of-record model

### Supabase Auth

Use Supabase Auth for:

- customer identity
- customer sessions
- magic-link verification
- password reset email flow

### Payload `users`

Keep Payload `users` as the business/profile/authorization record for:

- roles
- account relationship
- addresses
- phone
- company/account scope
- access checks in Local API queries

### Required bridge fields on `users`

Add and use fields such as:

- `supabaseAuthUserID`
- `emailVerifiedAt`
- `lastPortalLoginAt`
- `portalInviteState`
- `portalInviteTokenHash`
- `portalInviteExpiresAt`
- `portalInviteSentAt`

These fields let the app map a Supabase session back to the correct Payload user and account scope without turning customers into Payload-admin-session users.

## Target request/session flow

### Customer auth resolution

`src/lib/auth/getAuthContext.ts` should become hybrid:

1. check Payload auth first for real staff/admin session
2. if no Payload staff session is present, check Supabase customer session
3. resolve the Supabase user back to the Payload `users` record
4. load effective customer scope from Payload `users.account`
5. keep existing impersonation behavior for real admins only

### Result

This keeps:

- current admin flows intact
- current Payload access-control patterns usable, because Local API queries can still receive a real Payload `user` object with `overrideAccess: false`
- customer sessions separate from Payload admin auth cookies

## Required customer flows

### 1. Email/password sign-in

- use Supabase `signInWithPassword`
- keep `/login` as the single public customer auth entry

### 2. Magic-link sign-in

- add a "Email me a sign-in link" path on `/login`
- use Supabase `signInWithOtp`
- set `shouldCreateUser` carefully:
  - `false` for sign-in-only requests
  - `true` only on explicit claim/create flows
- route the link back through a first-party callback such as `/auth/confirm`

### 3. Forgot password

- add a public "Forgot password?" path from `/login`
- use Supabase `resetPasswordForEmail`
- redirect to a public reset handoff page that becomes authenticated through the reset link

### 4. Reset password

- create a change-password page for authenticated reset sessions
- call Supabase `updateUser({ password })`

### 5. Existing customer claim flow

Needed for customers already created in Payload by staff.

Recommended behavior:

- if staff already created the customer/user, claim flow should bind the Supabase auth identity to the existing Payload `users` row by email
- if the email is tied to a company account, use the existing `account` relationship
- do not create duplicate Payload users when the email already exists
- use a first-party claim token stored on the Payload `users` record so quote/invoice/schedule emails can deep-link directly into `/login`

### 6. Company invite flow

For commercial customers:

- admins or company admins should invite another company user by email
- invite email lands on the same auth surface
- accepted invite links the user to the same Payload `account`
- invite creation should reuse the same token-generation and completion helpers as claim-account so email delivery, expiry, and activation rules stay consistent

## Missing customer-side product gaps right now

### Authentication gaps

- quote, invoice, and schedule emails still need to deep-link into the shared claim/invite path by default
- self-signup policy is still undecided, so the auth surface currently supports both open signup and claim/invite-first activation
- company invite authority is still based on primary contact / billing-email ownership, not a dedicated company-admin permission model

### Activation / attention gaps

- quote, invoice, and schedule emails do not yet consistently push customers into account claim / sign-in flows
- there is no standard "view your estimate" or "view your account" CTA path tied to auth state
- no sequence enrollment currently upgrades a lead/customer into an account-claim flow

### Portal clarity gaps

- dashboard is usable, but first-login onboarding is still too generic
- customers need a clearer first-login state:
  - no estimate yet
  - estimate ready
  - invoice open
  - appointment needs scheduling
  - subscription active

## Implementation slices

### Slice A: auth foundation

- add Supabase auth clients/helpers
- add hybrid auth context
- add callback route for magic links / reset links
- add `supabaseAuthUserID` mapping on Payload `users`

Status:

- implemented with schema fields on `users`, verified-email fallback, `supabaseAuthUserID`, claim/invite token storage, and safe auto-create for unknown customer users

### Slice B: public login UX

- redesign `/login` into compact auth modes:
  - password
  - magic link
  - create account
- add forgot-password request screen
- add reset-password screen
- move claim/invite handling to a dedicated token-driven `/claim-account` route instead of exposing claim as a normal login tab

Status:

- password / magic-link / create-account tabs are live
- claim-account now lives on its own route and can either request a claim link or accept a tokenized claim/invite
- forgot-password and reset-password screens are live
- auth surface is now split into smaller login modules instead of one growing monolith

### Slice C: customer/account activation

- add claim-account flow for existing customers
- add company invite flow
- add quote/invoice email CTAs that deep-link into auth and then into the relevant portal page

Implementation notes:

- prefer one shared token helper instead of separate claim and invite token systems
- keep login/create/claim screens split into small auth modules rather than expanding one monolithic form component
- company-member invite management should live on the customer account surface for account-scoped users, not in admin-only UI

Status:

- shared claim/invite token flow is implemented and validated with integration plus Playwright coverage
- company-account invite UI is implemented on the account surface
- email CTA generation from quotes/invoices/schedules is still pending

### Slice D: tests

- integration coverage now includes `tests/int/lib/auth/portalAccess.int.spec.ts`
- Playwright coverage now includes admin preview plus company-access verification in `tests/e2e/admin.e2e.spec.ts`
- remaining browser coverage to add:
  - magic-link request UX
  - forgot-password request UX
  - reset-password page access
  - public claim-account happy path

## Open product questions

- Should public self-registration stay open for anyone, or should it eventually become claim/invite-first?
- Should magic-link sign-in create a user automatically when the email is unknown, or only for explicit signup/claim flows?
- Should company admins be able to invite users immediately in v1, or should that remain staff-only until billing/admin boundaries are tighter?
- Which customer emails should include account-claim CTAs first: quote sent, invoice sent, appointment scheduled, or all three?
