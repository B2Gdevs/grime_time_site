# Google Business Profile chat (deferred evaluation)

**Owner:** Product / ops  
**Tools:** Google Business Profile, SMS or WhatsApp routing, Payload CRM, staff inbox coverage  
**Last reviewed:** 2026-04-01

## What this means

`Add chat` here means adding a button on the **Google Business Profile** so someone browsing Search or Maps can start a real-time message thread instead of calling or emailing.

At the time of writing, Google's older native Business Profile chat flow has been shut down. The current replacement direction appears to be channel handoff through **SMS** or **WhatsApp** when available.

For Grime Time, that means this is not just a UI toggle. It becomes another live lead-intake channel that must be routed into the same business workflow as calls, forms, and quotes.

## Why this could be valuable later

### Lower friction at high intent

Someone on Search or Maps is often close to booking. Messaging can remove the "I do not want to call right now" barrier and capture a lead that might otherwise bounce.

### Better fit for quote-driven service work

Exterior cleaning usually benefits from a short back-and-forth:

- service type
- timing
- square footage or property type
- whether photos are available
- whether an on-site quote is needed

That makes messaging a potentially strong fit once routing and staff habits are mature.

### Differentiation on the listing

If nearby competitors are only exposing phone and website, a responsive chat entry point can stand out directly in Maps and local search.

## Why this is deferred for now

### Response-time pressure is real

Customers interpret this as live chat, not "we will get back to you tomorrow." Slow replies create frustration and can work against local-search performance if responsiveness is poor.

### Another inbox is operational debt

This would add one more monitored channel on top of:

- phone
- email
- website forms
- quote follow-up
- customer portal/account traffic

If the business cannot reliably watch it during business hours, "chat available" is worse than "no chat."

### Current Grime Time priority is stronger core operations

Right now the product should focus on:

- first-party CRM reliability
- quote and follow-up workflow
- portal/admin usability
- clean ownership, SLA, and lead-routing rules

Google Business Profile messaging should come after those are proven, not before.

## Decision rule for later

Turn this on only when all of the following are true:

- someone is explicitly responsible for monitoring the inbox during business hours
- the team can respond quickly enough to feel live, not next-day
- inbound messages can be copied or routed into Payload CRM without manual chaos
- staff has a short qualification playbook for pricing, availability, and scheduling questions
- lead attribution can distinguish Google Business Profile chat from forms, calls, and other inbound sources

Delay it if any of these remain weak:

- solo-operator overload
- no reliable same-day coverage
- no message-to-CRM handoff path
- no clear follow-up owner

## Recommended future setup

If Grime Time enables this later, prefer a narrow v1:

1. Business-hours-only coverage expectation
2. One routed messaging destination, not multiple parallel inboxes
3. Short response macros for:
   - service area check
   - quote intake
   - schedule availability
   - photo request
   - escalation to call
4. Manual or automated CRM logging so chats become leads, not lost conversations
5. Clear "move to call / quote form / on-site estimate" conversion step

## What Grime Time should revisit later

- whether Google is still supporting SMS / WhatsApp handoff in the current Business Profile product
- whether the team has enough staffing to protect responsiveness
- whether Grime Time wants live chat only during business hours or always-on async messaging
- whether CRM attribution and reporting should treat this as its own lead-source channel
- whether this is better launched after local-search momentum is already strong

## Planning status

This is intentionally **not** part of the current launch bar.

Track future work in:

- `ROADMAP.xml` phase `10`
- `TASK-REGISTRY.xml` task `10-01`
- `site-integrations-and-launch-checklist.md` "Not in scope yet"
