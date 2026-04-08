# Todo: resend-delivery-and-customer-email-verification

**Captured:** 2026-04-08
**Area:** messaging / quoting / customer portal
**Urgency:** normal

## What

Verify the current Resend-backed email flows in Grime Time, then close the gaps for customer-facing quote and contact experiences. This includes using the dev-safe Resend email lane, confirming sends are actually working end to end, and making sure quote-estimator or contact submissions produce the right internal and customer email outcomes.

## Why

The page blocks and app blocks are only useful if quote/contact interactions actually reach staff and customers reliably.

## Context

The current composer discussion surfaced that `serviceEstimator` and `contactRequest` are code-owned blocks tied to first-party workflows, not generic CMS content. The user specifically called out that `RESEND_API_KEY` is already configured for Grime Time and wants the team to return to dev-email verification soon, including customer notification behavior for estimator submissions and dashboard-visible quote data.

## Suggested next action

Review existing lead-form and quote notification flows, map every Resend send point, verify the current dev/test path, then add a scoped task for end-to-end email delivery checks plus any missing customer confirmation emails.
