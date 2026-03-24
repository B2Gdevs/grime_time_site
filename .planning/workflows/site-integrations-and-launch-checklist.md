# Site integrations and launch checklist

**Owner:** Product / ops  
**Tools:** Payload, EngageBay, Resend  
**Last reviewed:** 2026-03-23

## Stack in scope right now

- **Payload** for public-site content, forms, media, pricing display, and internal quotes
- **EngageBay** for contacts, deals, ownership, follow-up, and customer relationship management
- **Resend** for transactional form confirmations and system email

## Current launch checklist

### Public site

- [ ] Homepage hero, service breakdown, pricing explanation, and instant quote section reflect the real business
- [ ] Shared theme tokens, typography, and spacing look intentional across `/`, `/login`, and `/admin/login`
- [ ] Reviews / testimonials added and editable in Payload admin
- [ ] Before / after proof added
- [ ] Contact page and schedule page both work
- [ ] Schedule page has a valid EngageBay form ref and renders the real embed instead of the config warning state
- [ ] Header nav and footer nav reflect the real customer journey

### Instant quote and forms

- [ ] `Instant Quote Form` exists in Payload after seed
- [ ] Homepage quote widget submits to `form-submissions`
- [ ] Homepage quote widget is bound to the dedicated `Instant Quote Form` record after reseed, not the generic contact-form fallback
- [ ] Customer receives a confirmation email through Resend
- [ ] Team can see the lead in Payload admin
- [ ] Quote request fields are useful enough for follow-up and scoping

### EngageBay

- [ ] Form submissions create or update EngageBay contacts
- [ ] EngageBay API key is not hitting quota or trial-call limits during live tests
- [ ] Notes include quote-request details
- [ ] Tagging distinguishes website leads from scheduler leads
- [ ] Deal sync spec is finalized for Payload quotes -> EngageBay deals
- [ ] Ownership rotation and stale-lead follow-up rules are documented

### Resend

- [ ] `EMAIL_FROM` uses a verified sender
- [ ] Contact form confirmation email is live
- [ ] Instant quote confirmation email is live
- [ ] Delivery tested with a real inbox

### Ops follow-up

- [ ] Same-day response expectation documented
- [ ] Quote ownership queue defined
- [ ] Old-customer reactivation workflow defined
- [ ] Review-request email flow defined
- [ ] Maintenance-plan / recurring-service offer defined

## Near-term build priorities

1. Public site trust and conversion polish
2. Instant estimate flow that submits usable lead data
3. Quote -> EngageBay deal sync
4. Real KPI targets in the internal dashboard

## Not in scope yet

- Inngest
- Twilio / SMS review requests
- Public customer quote approval
- Accounting sync
