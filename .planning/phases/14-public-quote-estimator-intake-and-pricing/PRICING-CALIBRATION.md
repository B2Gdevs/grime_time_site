# Phase 14 Pricing Calibration

Date: 2026-04-04
Task: 14-02

## Outcome

The homepage estimator no longer treats every service as the same square-footage problem.

The current calibrated rules are:

- `house_wash` uses exterior wall count for 1-story and 2-story homes.
- 1-story house wash baseline: `$100` per wall.
- 2-story house wash baseline: `$150` per wall.
- House washes enforce a `4` wall minimum in the estimator.
- `3+` story house washes move to staff review instead of showing false precision.
- Flatwork, patio, dock, and similar services still use square footage, but the UI now says more clearly which scope drivers stay outside the instant estimate.

## Public-estimator inputs

Resolved direction for this task:

- Add a service-specific measurement lane instead of pretending one field always means square footage.
- Keep the single numeric input on the homepage for now, but make its label and help text service-aware.
- Use wall count for house wash.
- Keep square footage for driveway, porch/patio, dock, and similar flatwork lanes.

## Service-specific review boundaries

### House wash

- Public estimate is acceptable for `1` and `2` story homes when the customer can provide a reasonable exterior wall count.
- `3+` story homes are staff-reviewed.
- Photo review is required for `3+` story homes once the attachment lane ships.

### Driveway and flatwork

- Public estimate stays square-footage-led for the residential lane.
- Copy must say that driveway plus adjoining sidewalk photos help staff confirm scope faster.
- Copy must also say that standard pricing assumes customer-supplied water is available.
- Larger commercial flatwork, parking lots, fences, and building packages stay staff-reviewed until the expanded equipment lane is live.

### Porch / patio / dock

- Public estimate remains useful as a starting guide.
- Railings, stairs, furniture movement, shoreline access, algae severity, and mixed surfaces stay review variables rather than new homepage fields in this task.

## Copy direction fixed in this task

- Replace “live range” language with “starting guidance” where the estimator is not truly a range.
- Keep the core promise honest: instant quote now, confirmed scope after review.
- Add estimator-level disclaimer copy that says final scope is confirmed after surface, access, and photo review.
- Surface water-access and driveway-photo notes directly in the estimator instead of assuming staff will explain them later.

## Quote-settings direction

This task adds explicit quote-settings support for:

- house-wash per-wall pricing
- house-wash minimum walls
- house-wash manual-review note
- shared estimator disclaimer copy
- water-access note
- driveway photo note
- commercial expansion / manual-review note

That gives the next upload task a stable contract instead of bolting images onto the old square-footage-first model.
