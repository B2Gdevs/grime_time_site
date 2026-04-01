# Field-agent messaging and notifications

**Owner:** Grime Time product and implementation team  
**Tools:** Payload CMS, Next.js API routes, Resend, OpenClaw plugin SDK, OpenClaw Gateway, Stripe  
**Last reviewed:** 2026-04-01

## Purpose

Define the communication stack for field agents and internal operators without turning Grime Time into a chat-first product too early.

The immediate need is simple:

- when a quote or lead comes in, the right employee needs to be notified quickly
- field agents need an easy way to capture contact details, attachments, and follow-up context from a phone
- later, a field-agent chat assistant should work across the same Grime Time business systems as the in-app employee copilot

## Immediate rule

**Quote and lead notifications should ship through Payload jobs plus Resend first.**

Do not wait on OpenClaw, AI orchestration, or mobile chat channels just to notify the team that a quote arrived.

Why:

- email delivery is already aligned with the existing Grime Time integration direction
- quote notifications are deterministic system events, not conversational AI tasks
- delivery, templating, audit history, and retry behavior are easier to control with first-party jobs plus Resend
- this keeps field-assistant experimentation from blocking core business response time

## OpenClaw role

OpenClaw should be treated as a field communication and orchestration layer, not the source of truth for CRM, tasks, quotes, contacts, or permissions.

Grime Time stays the authority for:

- users, roles, and auth scope
- leads, contacts, accounts, opportunities, and tasks
- quote and billing context
- tour launch rules
- audit history

OpenClaw should sit on top of a shared internal tool surface that the in-app employee copilot can also use.

That means:

- Grime Time internal APIs or MCP-shaped tools expose narrow business actions
- the in-app copilot calls those tools
- the OpenClaw plugin calls the same tools
- channel-specific behavior lives in OpenClaw config and plugin code, not in core CRM logic
- the authenticated employee identity should come from the app's primary identity layer, which now means Clerk-backed user identity mapped into Payload authorization records

## Shared tool surface

The first tool layer should stay narrow and read-first:

- `get_my_tasks`
- `get_my_followups`
- `get_contact_summary`
- `get_quote_summary`
- `capture_contact_note`
- `capture_attachment_reference`
- `launch_tour`

Later write actions can expand carefully:

- create lead from captured phone note
- update follow-up status
- schedule callback
- confirm quote handoff

Every write-capable tool should require explicit auth checks and auditable operator identity.

## Channel order

### Right now

Use email notifications for quote and lead intake.

### First chat pilot

If the goal is the quickest live phone-based OpenClaw pilot, prefer a low-friction chat channel before real SMS. OpenClaw's current docs explicitly call Telegram the fastest channel to set up, while Slack is production-ready if the team already uses it.

### Field-native expansion

If the team wants a more phone-native workflow after the first pilot:

- WhatsApp is a better candidate than custom SMS for broad field use
- Discord is acceptable for internal staff coordination if that fits the team better than consumer messaging
- SMS or iMessage should be treated as a later operational path because the current OpenClaw iMessage route relies on macOS tooling and the docs point new deployments toward BlueBubbles rather than the legacy path

### Recommendation

1. Ship quote notifications by email.
2. Stand up the shared Grime Time tool surface.
3. Pilot OpenClaw on one low-friction chat channel.
4. Add WhatsApp or SMS-like behavior only after the first field workflow is proven.

## Notifications versus chat

Do not conflate these into one system.

### Notifications

System-driven, deterministic, templated, auditable:

- new quote request
- reassigned follow-up owner
- stale lead reminder
- appointment reminder
- invoice or subscription event

These belong in Payload jobs plus Resend.

### Chat assistant

Interactive, user-driven, permission-sensitive:

- show me my callbacks
- who needs a follow-up today
- attach these photos to the job
- launch the quote revision tour

These belong behind the shared Grime Time tool surface and can be exposed through OpenClaw later.

## Stripe direction

When Grime Time adds recurring services and subscriptions, adopt Stripe-hosted billing surfaces and infrastructure as deeply as practical:

- subscriptions when the recurring amount is stable
- hosted invoices and Stripe customer portal for standard customer payment behavior
- webhooks and reconciliation into Grime Time business records

Do not make OpenClaw responsible for payment rails.

OpenClaw can eventually:

- notify staff about failed payments or overdue invoices
- surface customer billing status to authorized operators
- help staff answer billing questions

but Stripe remains the payment system of record and Payload remains the business-facing ledger.

## Immediate implementation order

### 11-01

Quote and lead-notification email flow:

- choose employee routing rules
- create templated Resend notifications
- send on inbound quote and key follow-up transitions
- record delivery and audit state in Grime Time

### 11-02

Shared internal tool contract for employee copilot and OpenClaw plugin.

### 11-03

OpenClaw plugin proof of concept for field-agent-safe read-first actions.

### 11-04

Stripe subscription and recurring-billing expansion tied to Grime Time service plans.
