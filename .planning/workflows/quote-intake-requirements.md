---
title: Quote Intake Requirements
description: Attachment metadata, marketing/contact info, and dynamic UI requirements for Phase 14.
---

# Quote Intake & Metadata Requirements

## Attachment strategy
- Attachments live on the quote record (`quotes.photoAttachments`) so thumbnails can show in the metadata tile and ops can trace the image back to the job.  
- Mandatory photos per service: house wash (front, back), driveway (full, angle).  
- Conditional shots: close-up if stains/damage; access/gate shots only appear when needed.  
- Missing photos never block submission; they set flags (`missingPhotos`, `needsReview`) on the quote.

## Conditional fields

| Field | Trigger | Display location |
| --- | --- | --- |
| Gate code | Customer indicates gate | Access section of metadata tile |
| Additional contact | Customer supplies alternate | Access section |
| Special directions (how they want it done) | Customer enters “custom instructions” | Scope section |
| Stain/damage checkbox | Customer asserts issue | Condition section & triggers manual review |

Only show these fields when the customer answers “yes” or uploads corresponding media. The quote metadata tile reuses the same UI slot and swaps content per service.

## Marketing + contact needs
- Keep contact info minimal: name, phone, email, posting address.  
- Additional marketing/ops info is maintained within `quotes.metadata` (e.g., `marketingCampaign`, `leadSource`).  
- Gate further follow-up via a `quoteIntakeQuestions` block that surfaces additional instructions only when the customer selects “Let us know anything else.”

## Subscription/payment plan notes
- Subscription offers are service plans with a twelve-month term, monthly billing, and per-service discounts.  
- Display discount terms inside the quote tile (e.g., “$X/month plan, Y visits/year”).  
- Include a summary of the early cancellation rule (“Remaining discount difference billed on cancellation”) and failed-payment pause logic so operations know when to freeze service.

## Ops flags (not shown to customer)

| Flag | Meaning |
| --- | --- |
| `needsManualReview` | 3+ story house, missing required photos, or heavy stains |
| `missingPhotos` | Any required photo absent |
| `riskLevel` | High for multi-story or complex services |

These flags feed the ops-only part of the metadata tile but are hidden from customers.

