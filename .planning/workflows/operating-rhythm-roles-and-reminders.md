# Operating rhythm, roles, and reminders

**Owner:** Ops + CRM admin  
**Last reviewed:** 2026-03-26  
**Audience:** Internal staff and implementation planning.

## Goals

- Define what each role is expected to do each day.
- Keep customer data and employee/admin data strictly separated.
- Ship reminders quickly using existing worker inboxes before mailbox OAuth.

## Boundary policy (must not regress)

1. Public users see only public content.
2. Logged-in customers see only their own user data and account-scoped records.
3. Company-admin customers may manage users only inside their own account/company.
4. Internal docs, cross-account queues, cross-user reporting, and admin controls are staff-only.
5. Impersonation never grants internal tools to non-admin effective users.
6. `Customer home` for staff should run in explicit preview context (effective customer user), not raw admin context.

## Internal roles (multi-role allowed, task-first)

Employees can hold multiple roles; permissions and queue duties are additive.
For a small 2-person team, this is task-first (not corporate job titles).

- **field-tech:** Job execution updates, completion notes, and property-specific follow-up.
- **lead-followup:** New lead responses and quote follow-up cadence.
- **scheduler:** Appointment confirmations, reschedules, and day-of reminders.
- **billing-followup:** Invoice reminders, payment-status checks, and billing exception queue.
- **ops-admin:** Cross-account operations, internal docs, policy/rules updates, escalations.

Suggested day-one assignment:

- Worker A: `field-tech`, `lead-followup`, `scheduler`
- Worker B: `field-tech`, `lead-followup`, `scheduler`
- Owner/admin account: `ops-admin`, `billing-followup` (and optional assist roles)

## Daily operating rhythm

1. Start of day: clear overdue tasks first.
2. Process due-today tasks next.
3. Process new unassigned items (lead/quote/invoice events).
4. End of day: unresolved tasks must have next action, owner, and due date.

## Required task contract

Every actionable item must have:

- `ownerUser`
- `roleTags[]`
- `dueAt`
- `priority`
- `nextAction`
- `sourceType` (lead, quote, appointment, invoice, sequence, manual)
- `account` relationship (required where applicable)

No stage change should finalize without a next action and due date.

## SLA defaults (v1 shipped defaults)

- New lead first touch: 10 minutes during business hours; if after-hours, by next business day 8:30 AM.
- Quote follow-up cadence: 4 hours after send, then +24 hours, then +72 hours.
- Appointment reminders: immediately on booking, then 24 hours before, then 2 hours before service window.
- Invoice reminders: 1 day before due date, on due date, then +3 days overdue and +7 days overdue.

Escalation v1:

- Missed once: notify both workers.
- Missed twice: notify `ops-admin` and pin item in overdue queue until resolved.

## Support / policy SLA classes (v1 shipped defaults)

- **General support/contact:** acknowledge within 1 business day.
- **Billing support:** acknowledge within 1 business day; resolution target 3 business days.
- **Refund request:** acknowledge within 1 business day; decision target 5 business days.
- **Policy/privacy request:** acknowledge within 1 business day; route to ops-admin queue immediately.

## Default owner routing

Until a round-robin allocator exists, CRM ownership is deterministic:

1. explicit preferred owner
2. related account owner
3. stable seeded admin roster from `resolveSeedStaffEmails()`
4. first created admin user

This keeps new lead/task/billing records assigned even in demo and local environments.

## Refund routing

- `billing-followup` owns the first review and documents the issue/outcome.
- `ops-admin` is included on the same task for approval/escalation.
- Refund tasks should leave the queue with a concrete next action and due date, never just a status change.

## Reminder delivery policy (fastest path)

Phase 1 (default now):

- Payload jobs generate reminders and digest events.
- Resend delivers to each worker's preferred existing inbox.
- Worker inbox may be personal or company email.
- No mailbox OAuth required for day one.

Phase 2 (optional later):

- Add Gmail/Microsoft connect for users who want provider-native sync.
- Keep Resend path as fallback.

## Implementation slices

1. Add role matrix and additive role checks.
2. Add task SLA metadata and escalation job.
3. Add reminder and digest jobs (Resend delivery).
4. Add per-user notification preferences.
5. Add company-admin customer user-management boundaries.
6. Add observability: reminder send log + task escalation log.
7. Add support/refund policy queue classes with explicit SLA timers.
8. Add discount policy fields and rule evaluation order.

## Company-admin customer permissions (locked intent)

Company-admin customers can:

- View and manage users in their own company only.
- Promote/demote company users to company-admin within their own company.
- Remove users from their own company.
- View company billing context: invoices (current + history), subscriptions, payment methods, and related billing state.

Company-admin customers cannot:

- Access other companies or any internal admin/docs/ops surfaces.
- Change global billing/system settings.

## Preview user and seed identity contract (v1)

- Keep one stable non-admin preview account for daily customer-view checks: `test_user`.
- `test_user` must never carry admin/staff roles.
- Keep the seeded staff/admin set available for internal testing and ownership:
  - `bg@grimetime.local` (admin)
  - `pb@grimetime.local` (admin)
  - `de@grimetime.local` (admin)
- In staff portal navigation:
  - show `Ops dashboard (admin)` for internal context
  - show `Customer home (test_user)` for customer-preview context
- In preview/customer context, hide admin-only docs and links (`/docs`, Payload admin, quote settings, cross-account tools).

## Discount policy (implemented default)

Support both:

- **Account-level discounts:** apply to entire company/account.
- **User-level discounts:** targeted overrides for a specific user/contact.

Implemented precedence:

1. User-level override (if present)
2. Account-level default
3. Standard pricing policy

Supported variants:

- percentage discounts
- flat amount discounts

Billing UI should always show whether the active discount came from the user override or the account default.

## Verification checklist

- Overdue queue is never empty when overdue tasks exist.
- Every queue item shows owner + due + next action.
- Customer account cannot access internal docs or cross-account data.
- Company-admin customer can manage users only in their own account.
- Reminder emails deliver to configured worker inboxes.
- Support, billing, refund, and policy requests appear in the correct SLA queue class.
- Discount preview clearly shows whether account-level or user-level rule is active.
