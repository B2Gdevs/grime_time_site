---
title: Quote Industry Intake Metadata
description: Shared metadata requirements for quote, estimator, contact, and subscription intake surfaces.
---

# Quote intake metadata contract

Phase `14-07` defines the reusable metadata tile that should sit beside or under the quote UI as follow-on work expands. The goal is to stop each intake surface from inventing its own partial context rules.

## Core metadata groups

## Customer and contact

- Full name
- Email
- Phone
- Preferred reply lane when relevant
- Property address or service city

## Job scope

- Service key or requested lane
- Measurement label plus value
- Story count or height class when relevant
- Surface condition
- Frequency or maintenance interest
- Freeform notes for access, HOA, gates, hazards, or stains

## Attachment metadata

- Attachment count
- Per-file filename
- Content type
- File size
- Intake source
- Internal review status

## Scheduling and conversion

- Scheduling requested or not
- Preferred window
- Preferred date
- Property type
- Approximate site scope
- Water access confirmed, unclear, or unavailable

## Commercial and payment follow-up

- Residential vs commercial signal
- Mixed-surface or multi-building signal
- Subscription or recurring-plan interest
- Payment questions:
  - one-time vs recurring
  - invoice timing
  - deposit required or not
  - card on file or manual invoice follow-up

## Manual-review rules tied to the metadata tile

The shared tile should visibly flag manual review when one or more of these are true:

- `house_wash` with `3+` stories
- heavy organic growth or unusual hazard notes
- mixed-surface scope that the current public range does not model well
- driveway or flatwork requests where photos are needed to confirm layout or buildup
- commercial expansion lanes such as sidewalks, parking lots, fences, or larger building packages
- unclear or missing water access
- attachment review shows safety, access, or severity issues that change labor

## Reusable UI direction

The future metadata tile should be portable across:

- homepage instant quote follow-up surfaces
- internal quote detail
- contact-request promotion into a quote
- scheduling or recurring-plan qualification

The tile should show:

- top-line contact and property context
- estimator inputs and resulting range label
- attachment summary with review state
- manual-review badges
- payment or subscription questions still unresolved

## Immediate phase-14 outcome

- The estimator upload route now stores attachment metadata and submission linkage.
- The next quote-component work can reuse these fields instead of re-asking for basic intake context.
- This doc is the contract source for any shared intake metadata tile added later.
