# Todo: composer-media-target-model

**Captured:** 2026-04-07
**Area:** composer / media architecture
**Urgency:** high

## What

Unify media targeting in the page composer so canvas selection, service-lane selection, media-tab selection, and gallery assignment all share one authoritative state model instead of mixing local component state with drawer-local slot state.

## Why

Repeated media regressions are coming from multiple independent selection models rather than a single stable source of truth.

## Context

Current issues:
- `ServiceGrid` owns lane selection with local `activeIndex`
- the drawer owns `selectedMediaPath`
- slot resolution is regex-special-cased in multiple places
- gallery assignment, replace flows, and canvas selection can point at different effective targets

Desired direction:
- one composer-level target model for selected block + selected media slot + selected service lane when applicable
- block components read/write that model instead of inventing local selection state while the composer is open
- future media-capable blocks register slots through one shared contract

## Suggested next action

Plan and implement this before adding more media-capable blocks or continuing slot-specific fixes.
