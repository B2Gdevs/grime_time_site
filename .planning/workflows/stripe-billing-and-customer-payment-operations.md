# Stripe billing and customer payment operations

**Owner:** Grime Time product and implementation team  
**Tools:** Payload CMS, Next.js API routes, Stripe, Resend  
**Last reviewed:** 2026-03-25

## Why this exists

Grime Time needs one billing model that works for:

- residential customers who want to pay online
- customers who want autopay with saved card or bank details
- commercial companies that prefer monthly invoicing on terms
- customers who pay onsite or outside the app
- customers who never create an app login

The goal is the quickest, cleanest, lowest-maintenance system:

- Stripe handles payment rails, hosted payment surfaces, invoice delivery, stored payment methods, and self-serve billing updates
- Payload keeps the business-facing billing ledger, CRM context, service policy, and operational status
- Resend stays focused on non-payment lifecycle communication unless Stripe email coverage is insufficient

## Recommended billing model

### Core rule

Use **Stripe-hosted billing surfaces by default**:

- **Hosted Invoice Page** for invoice payment
- **Stripe customer portal** as the standard self-serve payment-method and invoice-management path for customers who have an account link
- **Stripe subscriptions** only when the billing cadence is truly recurring and predictable

Use **Payload as the internal billing ledger**:

- invoice context
- customer/account linkage
- service-plan policy
- service completion status
- offline payment notes
- internal reconciliation and reporting

## Why this is the right default

This is the fastest path with the least custom payment UX to maintain.

Stripe currently supports:

- manual and automatic collection methods for invoices and subscriptions
- `send_invoice` with adjustable payment windows and reminders
- Hosted Invoice Pages that Stripe emails or that staff can send directly
- a customer portal where customers can manage payment methods, invoices, and subscriptions
- marking invoices paid out of band when payment happens outside Stripe

Official references:

- https://docs.stripe.com/billing/collection-method
- https://docs.stripe.com/invoicing/overview
- https://docs.stripe.com/invoicing/hosted-invoice-page
- https://docs.stripe.com/customer-management
- https://docs.stripe.com/no-code/customer-portal

## Billing modes we should support

### 1. One-off residential or commercial invoice

Use when:

- a customer has a single completed job
- a customer wants an emailed invoice instead of stored autopay
- a company does not want to save payment details with us

Recommended Stripe shape:

- create Stripe Customer
- create Stripe Invoice
- use Hosted Invoice Page
- set `collection_method` based on account preference:
  - `charge_automatically` if they already have a payment method on file and want autopay
  - `send_invoice` if they want manual payment or terms

Payload stores:

- invoice record
- account/contact linkage
- related service appointment(s)
- related quote / opportunity
- notes and internal payment state

### 2. Commercial monthly invoicing on terms

Use when:

- a company wants a 30-day service window
- billing should happen monthly instead of per visit
- the company wants invoice terms rather than stored autopay

Recommended default:

- treat this as a **terms account**
- generate a Stripe invoice on a monthly cadence
- set `collection_method=send_invoice`
- default to **net 30**
- let Stripe send reminders and host the payment page

Important distinction:

- if the monthly amount is fixed and truly subscription-like, Stripe Billing subscriptions can still be used with `send_invoice`
- if the monthly amount varies by actual completed work, route density, add-ons, or partial-month changes, create a **monthly consolidated invoice** from Payload job/service records instead of forcing a Stripe subscription

Default recommendation:

- **fixed recurring amount**: Stripe subscription
- **variable monthly billing**: monthly invoice generated from Payload service records

This avoids bending subscriptions into a variable commercial A/R workflow they are not ideal for.

### 3. Subscription / autopay plan

Use when:

- the amount is stable
- the customer wants auto-billing
- they are comfortable storing a card or bank account with Stripe

Recommended Stripe shape:

- Stripe subscription
- `collection_method=charge_automatically`
- card, debit, ACH, or supported bank method managed through Stripe

Payload stores:

- service-plan business rules
- visit cadence
- source quote
- scheduling anchor
- portal-visible state
- local derived summaries

### 4. Onsite or out-of-band payment

Use when:

- tech collects payment onsite
- customer pays by check, cash, external ACH, or some other non-Stripe path
- a company pays through AP outside the hosted payment page

Recommended handling:

- keep the Stripe invoice if one exists
- mark it **paid out of band** in Stripe
- mirror that state into Payload
- store internal notes about payment channel and reference

If there is no Stripe invoice yet:

- create the internal Payload invoice first
- optionally create/finalize the Stripe invoice for paper trail
- then record it as paid out of band if the payment already happened

This keeps one billing ledger and avoids “paid but no invoice trail” drift.

## No-login requirement

Commercial customers should **not** be required to create an app login to:

- receive invoices
- pay invoices
- maintain a subscription
- update payment methods

Default external customer surfaces:

- Hosted Invoice Page for paying an invoice
- Stripe customer portal for standard payment-method and invoice self-service when we have a customer account context

Stripe’s customer portal can be shared directly and uses email plus one-time passcode login. It also supports invoice-only flows, not just subscriptions.

Official references:

- https://docs.stripe.com/customer-management
- https://docs.stripe.com/no-code/customer-portal

Portal account in Grime Time should remain optional:

- if a customer has a Grime Time login, we should deep-link them into Stripe portal sessions from their account and invoice views
- if they do not, billing still works through Stripe-hosted links and emailed invoices

## Resend versus Stripe email

### Use Stripe for billing emails by default

Use Stripe email delivery for:

- invoice send
- hosted invoice payment link
- invoice reminders
- payment receipts where Stripe already provides them

Reason:

- less custom code
- less custom compliance and payment-email surface area
- fewer cases where Payload and Stripe email disagree

### Use Resend for non-payment lifecycle messaging

Use Payload jobs + Resend for:

- lead follow-up
- quote reminders
- appointment confirmations and reminders
- post-job follow-up
- win-back
- custom service communication that is not purely financial

Fallback:

- if we need a branded internal wrapper around Stripe’s invoice link, Resend can send a companion email that contains the Hosted Invoice Page URL, but Stripe should still own the actual payment page and reminder schedule

## Data model additions we need before implementing 07-04

### Accounts

Add account-level billing policy fields:

- `billingMode`: `autopay_subscription`, `send_invoice_terms`, `send_invoice_due_on_receipt`, `manual_internal`
- `billingTermsDays`: default `30` for commercial terms accounts
- `billingRollupMode`: `per_service`, `monthly_consolidated`, `subscription`
- `stripeCustomerID`
- `portalAccessMode`: `none`, `stripe_only`, `app_and_stripe`

### Invoices

Expand invoices with Stripe and reconciliation data:

- `stripeInvoiceID`
- `stripeHostedInvoiceURL`
- `stripeInvoiceStatus`
- `paymentCollectionMethod`
- `paymentSource`: `stripe`, `onsite`, `check`, `cash`, `bank_transfer`, `other`
- `paidOutOfBand`
- `paidAt`
- `paymentReference`
- `billingPeriodStart`
- `billingPeriodEnd`
- `deliveryStatus`

### Service plans

Expand plans with billing-mode data:

- `stripeSubscriptionID`
- `billingMode`
- `collectionMethod`
- `billingTermsDays`
- `paymentMethodRequired`
- `autoRenew`

### Service appointments or completed work

We need a clean way to roll completed work into invoices:

- `billableStatus`
- `billingBatchKey`
- `invoiceID`
- `completedAt`
- `onsitePaymentCaptured`

### Payment event history

Recommended new collection:

- `billing-events` or `payment-events`

Use it for:

- Stripe webhook log entries
- onsite payment records
- manual adjustments
- discounts and courtesy credits
- refund requests and refund outcomes
- invoice sent / reminded / paid events
- failed payment recovery trail

### Billing adjustments

We need a fast internal way for admins to handle billing changes without relying only on raw Stripe dashboard usage.

Required adjustment flows:

- record onsite payment
- record check or bank-transfer payment
- mark paid out of band
- apply discount before payment
- issue courtesy credit after payment
- record refund request
- complete full or partial refund
- mark write-off / uncollectible

Recommended model:

- **Discount before payment:** revise the open invoice or issue a pre-payment credit note
- **Courtesy credit or service issue after payment:** issue a Stripe credit note tied to the invoice
- **Refund after payment:** issue refund plus credit note linkage in Stripe, then mirror in Payload
- **Manual non-Stripe giveback:** record out-of-band credit on the Stripe invoice and mirror in Payload

Stripe docs for this:

- credit notes: https://docs.stripe.com/invoicing/dashboard/credit-notes
- programmatic credit notes: https://docs.stripe.com/invoicing/integration/programmatic-credit-notes
- refunds: https://docs.stripe.com/refunds

## Recommended implementation order inside phase 07-04

### 07-04A: Stripe customer + invoice foundation

- create Stripe customer mapping from account/contact
- add invoice Stripe IDs and hosted URLs
- create one-off invoices from Payload
- send Hosted Invoice Page links
- store webhook-driven status in Payload

### 07-04B: Out-of-band and onsite payment recording

- let staff mark an invoice paid onsite / out of band
- mirror that in Stripe and Payload
- store payment source and reference
- expose the status in `/ops` and customer invoice history

### 07-04C: Billing adjustments and refunds

- support admin quick-edit actions for discount, courtesy credit, refund, and write-off flows
- use Stripe credit notes and refunds where appropriate instead of freeform manual edits
- store adjustment reason, operator, and timestamp in Payload
- expose the resulting billing state in `/ops`, account detail, and invoice history

### 07-04D: Commercial terms and monthly billing

- support account billing policy fields
- support monthly consolidated invoice generation from completed work
- support commercial net-30 defaults and reminder handling

### 07-04E: Stripe portal-session management

- create Stripe portal sessions for logged-in customers
- expose direct billing-management links in the customer portal
- support no-login customers through emailed invoice links and direct portal links

### 07-04F: Autopay subscriptions

- connect `service-plans` to Stripe subscriptions
- support `charge_automatically` for autopay plans
- support `send_invoice` where the recurring amount is fixed but AP still wants invoice terms

## UX rules for billing surfaces

### Customer UX

- do not force app login for billing
- show a compact invoice/history/payment-method summary in the app only when a customer account exists
- primary actions should be obvious:
  - pay invoice
  - manage payment methods
  - download invoice
  - update billing contact

### Admin UX

- billing state should be visible in `/ops` and account detail
- commercial accounts should show terms, billing mode, AP contact, outstanding invoices, and last payment status without digging
- admins need a fast way to record or adjust:
  - invoice sent
  - invoice resent
  - paid onsite
  - paid by check
  - paid by bank transfer
  - discount applied
  - courtesy credit issued
  - refund requested
  - refund completed
  - write-off / uncollectible

Initial implementation note:

- this can start in Payload admin CRUD plus focused internal routes
- once the billing model is stable, add compact admin quick actions in `/ops` and account detail instead of forcing every change through the raw collection editor

## Recommended defaults

- **Residential one-off jobs:** Stripe invoice or payment link, due on receipt
- **Residential recurring plans with self-serve billing:** Stripe subscription with automatic collection
- **Commercial fixed monthly contract:** Stripe subscription with either `charge_automatically` or `send_invoice`, depending on AP preference
- **Commercial variable monthly work:** monthly consolidated Stripe invoice with `send_invoice` and 30-day terms
- **Onsite or external payment:** keep invoice in Stripe/Payload and mark paid out of band

## Key decision summary

1. Stripe-hosted billing surfaces should be the default customer-facing payment UX.
2. Payload should own business meaning, but not raw payment credential management.
3. Customers and companies should not need a Grime Time login to be billed or to pay.
4. Stripe customer portal should be the standard self-service billing path for customers who have an account context, but it must not become a hard requirement for no-login billing.
5. Commercial billing must support both:
   - fixed recurring autopay
   - variable monthly invoicing on terms
6. Staff must be able to record onsite and out-of-band payments, discounts, credits, and refunds cleanly without losing invoice history.
