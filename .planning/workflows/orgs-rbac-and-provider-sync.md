# Orgs, RBAC, and provider sync

**Owner:** auth / platform  
**Tools:** Clerk, Payload, Stripe, internal webhooks/events  
**Last reviewed:** 2026-04-01

## Why this exists

Grime Time now has real Clerk identity, but the business still needs a provider-agnostic authorization model:

- one Grime Time staff org today
- future customer orgs and account admins
- role flips and access toggles from our own admin
- external apps listening when users, memberships, roles, or lock state change
- the ability to swap identity providers later without rewriting org/business rules

This document defines the direction before the repo hardcodes Clerk org semantics too deeply.

## Current bootstrap org

Current Grime Time staff org in Clerk:

- `org_3BmXmwG7NpGNO1JKpE3MkR667Mm`

This id should be treated as an external provider id, not the primary app org id.

## Core rule

**Payload stays the source of truth for business authorization.**

Clerk is an identity and session provider.

Payload owns:

- organizations / workspaces
- organization memberships
- role templates
- entitlements / permissions
- lock and unlock state
- provider id mappings
- outbound event emission for other internal/external apps

Clerk owns:

- sign-in
- sign-up
- social login
- sessions
- user profile basics
- optional mirrored org membership and role display

## Model direction

### First-party org layer

Add or formalize first-party records for:

- `organizations`
- `organization-memberships`
- `membership-role-template` or equivalent normalized role field
- provider mappings:
  - `provider`
  - `externalOrgId`
  - `externalMembershipId`
  - `externalUserId`

Do not make Clerk org ids the primary foreign key in app logic.

### Role model

Start with explicit app roles:

- `owner`
- `admin`
- `staff`
- `customer-admin`
- `customer-member`

And separate those from entitlements such as:

- `ops:access`
- `ops:write`
- `billing:write`
- `crm:write`
- `content:write`
- `org:manage-members`
- `org:manage-settings`
- `impersonation:use`

The role template grants a baseline entitlement set. Admin can then lock or unlock specific entitlements in first-party app state.

Do not treat Clerk system organization permissions as the primary runtime permission source for app behavior. Use first-party entitlements and, if mirrored provider-side checks are needed, treat them as adapter state rather than the canonical business rule set.

## Sync direction

### Source-of-truth split

Use a split-authority sync model instead of naive global last-write-wins.

**Clerk-authoritative fields**

- email
- display name
- avatar/profile basics
- auth-provider identity metadata

**App-authoritative fields**

- org membership existence
- org role template
- entitlements
- lock state
- billing/admin flags
- impersonation eligibility

### Mirrored fields

For fields intentionally mirrored in both systems, keep:

- `lastInternalWriteAt`
- `lastProviderWriteAt`
- `lastSyncedAt`
- `lastSyncSource`

If a mirrored field changes in either system, reconcile by field-family timestamp and log conflicts instead of silently mutating unrelated authorization state.

Do **not** let a Clerk-side change overwrite app-only lock state or entitlements just because it is newer overall.

## Eventing direction

The app should emit domain events whenever admin or automation changes:

- user created
- user updated
- organization created
- organization updated
- membership created
- membership role changed
- membership locked/unlocked
- entitlement changed

External apps should subscribe to **our** events first, not Clerk directly.

That way:

- changing a role in Grime Time admin emits a first-party domain event
- the Clerk adapter syncs afterward
- downstream systems hear about the business event from us

Clerk webhooks are still useful, but they should flow into a sync/reconciliation worker, not become the only integration surface.

## Admin UX requirements

The internal admin/workspace should support:

- see current org and provider mapping
- assign user to org
- promote/demote role template
- lock/unlock entitlements
- see last sync source and timestamps
- manually resync provider state
- conflict badge when app and Clerk drift

For the current Grime Time org, staff users in the Grime Time organization should be promotable to admin from our own app/admin surface without requiring manual Clerk dashboard work.

## Stripe linkage

Stripe linkage follows the same rule:

- Stripe ids live on first-party user/account/org records
- provider identity swap should not require billing model rewrite

## Implementation slices

### Slice A

- define first-party organization + membership model
- store Clerk org id as external mapping on the Grime Time org
- add role template and entitlement model

Status:

- shipped on 2026-04-01 in `src/collections/Organizations`, `src/collections/OrganizationMemberships`, `src/lib/auth/organizationRoles.ts`, `src/lib/auth/organizationAccess.ts`, and `src/lib/auth/organizationSync.ts`
- current bootstrap maps the Grime Time staff org to Clerk org `org_3BmXmwG7NpGNO1JKpE3MkR667Mm`
- staff/admin auth guards now treat first-party memberships as the source of Payload-admin eligibility, with legacy `users.roles` kept only as a compatibility bridge

### Slice B

- add admin UI for membership role changes and lock/unlock
- emit first-party org/user/membership events

### Slice C

- inbound Clerk webhook sync
- outbound Clerk membership/role sync
- conflict log + manual resync action

### Slice D

- portfolio reuse: same first-party org/membership/provider-mapping contract, even if product surfaces differ

## Non-goals

- hard-binding business authorization directly to Clerk org role strings
- depending on Clerk's paid impersonation add-on
- letting external apps depend only on Clerk events for business state
