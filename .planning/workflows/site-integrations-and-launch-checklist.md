# Site integrations and launch checklist

**Owner:** Product / ops  
**Tools:** Payload, Stripe, Resend  
**Last reviewed:** 2026-03-23

## Stack in scope right now

- **Payload** for public-site content, forms, media, pricing display, and internal quotes
- **Payload** for internal CRM records, follow-up state, and customer relationship management
- **Stripe** for billing and payment rails
- **Resend** for transactional form confirmations and system email

## Current launch checklist

### Public site

- [ ] Homepage hero, service breakdown, pricing explanation, and instant quote section reflect the real business
- [ ] Shared theme tokens, typography, and spacing look intentional across `/`, `/login`, and `/admin/login`
- [ ] Reviews / testimonials added and editable in Payload admin
- [ ] Before / after proof added
- [ ] Contact page and schedule page both work
- [ ] Schedule page and customer portal scheduling flow feel complete on mobile and desktop
- [ ] Header nav and footer nav reflect the real customer journey

### Instant quote and forms

- [ ] `Instant Quote Form` exists in Payload after seed
- [ ] Homepage quote widget submits to `form-submissions`
- [ ] Homepage quote widget is bound to the dedicated `Instant Quote Form` record after reseed, not the generic contact-form fallback
- [ ] Customer receives a confirmation email through Resend
- [ ] Team can see the lead in Payload admin
- [ ] Quote request fields are useful enough for follow-up and scoping

### Internal CRM

- [ ] Form submissions create or update first-party lead records and follow-up state
- [ ] Lead, contact, account, opportunity, activity, and task relationships are documented
- [ ] Ownership rotation and stale-lead follow-up rules are documented
- [ ] Quote-to-opportunity promotion is defined for accepted and active quotes

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
3. Quote -> internal opportunity workflow
4. Real KPI targets in the internal dashboard

## Not in scope yet

- Inngest
- Twilio / SMS review requests
- Google Business Profile live messaging until the team can cover near-real-time replies and route that inbox into the real lead workflow
- Public customer quote approval
- Accounting sync
