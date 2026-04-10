---
name: staff-admin-clerk-role-preservation
description: >-
  When Grime Time staff access is managed from `/portal/ops/users`, assign or
  update the first-party staff membership before sending Clerk invites or syncing
  provider data, and preserve that app-owned role template and non-active status
  when Clerk membership reconciliation runs so Clerk's coarse org roles do not
  flatten internal operator versus designer distinctions or accidentally
  reactivate suspended staff.
---

# Staff Admin Clerk Role Preservation

## When to use
- You are adding or debugging `/portal/ops/users` invite, role-template, suspension, or provider-resync actions.
- Clerk organization roles only give you `org:member` versus `org:admin`, but Grime Time still needs first-party staff roles like `staff-operator` and `staff-designer`.
- A sync path is about to overwrite an existing first-party staff membership with a provider-derived role or reset a suspended membership back to active.

## The pattern
1. Upsert the Grime Time default staff organization membership locally first.
2. Store the intended `roleTemplate` on the first-party membership before sending a Clerk invite or direct membership grant.
3. Mirror only the coarse Clerk role outward.
4. During auth-time reconciliation, attach `clerkMembershipID` and `syncSource`, but keep the existing first-party staff `roleTemplate` when one already exists.
5. If the existing membership is `suspended` or `revoked`, preserve that non-active status during sync instead of writing `active`.

```ts
const nextRoleTemplate =
  existingMembership &&
  existingMembership.roleTemplate?.startsWith('staff-') &&
  roleTemplate.startsWith('staff-')
    ? existingMembership.roleTemplate
    : roleTemplate

const nextStatus =
  existingMembership && existingMembership.status && existingMembership.status !== 'active'
    ? existingMembership.status
    : 'active'
```

Use that pattern inside the sync helper before updating `organization-memberships`.

## Why
If you let Clerk membership sync become authoritative for staff roles, any non-admin internal role collapses to the coarse provider role mapping. In Grime Time that means a deliberate `staff-operator` assignment can get flattened back to `staff-designer` just because Clerk only returned `org:member`. The same mistake can silently undo app-owned suspensions if reconciliation always writes `status: active`. The durable business authorization model lives in Payload memberships, not in the identity provider.

## Failure modes
- Sending a Clerk invite before persisting the local membership means the accepted user comes back with only the provider-derived role.
- Reconciliation that always writes `status: active` can accidentally undo first-party suspensions or revocations.
- UI actions that call Clerk directly without a local service layer leak provider shape into the app contract and make later provider swaps harder.

## Related
- `orgs-rbac-and-provider-sync.md`
- `page-composer-stable-section-identity.md`
