# Page composer: human edits vs agent “regression” recovery (2026-04-10)

## What happened

- A Codex/GAD-style session spent most of its time **undoing intentional subtractions**: restoring **current-block media slots**, **upload/generate** on the media tab, and **canvas interactive lane selection** for the service grid—often in favor of flows closer to a **popup/modal** pattern the author had moved away from.
- **Additions** from the same stretch of work were largely left in place; **removals** were treated as regressions and reverted because tests and prior specs expected the older hybrid surface.

## Why agents defaulted that way

- Phase 18 closeout and skills (e.g. hybrid media tab + slot list) **codified** that UX as the expected contract.
- Those choices were **not** reflected as tasks or explicit “we removed X on purpose” notes, so failing tests read as **bugs to fix**, not **product direction**.

## Open product issues (still true)

- **Service grid drag-and-drop**: works for the **first** service lane only; **not** for other lanes—treat as a real bug / incomplete implementation under phase 19 composer work.

## Process takeaway (see `D-process-029`)

Before a long autonomous pass on composer UI:

1. Add a line to **`STATE.xml` next-action** or **`TASK-REGISTRY`** describing what you **removed** or **simplified** on purpose.
2. Or drop a short note under **`.planning/notes/`** (this file pattern).
3. Optionally adjust or quarantine tests **in the same change** so green CI matches the new direction—otherwise agents will keep “fixing” toward the old golden path.

## Rigorous testing—what to contemplate

- **Keep rigor**, but **scope tests to declared product intent**: when UX intentionally changes, update assertions in the same PR/session so tests enforce the *new* contract.
- **Alternative**: maintain fewer integration tests for volatile UI and lean on smaller unit tests—tradeoff is less protection against accidental removal of critical flows.

No decision locked here; `D-process-029` records the proposal to always **signal human intent** before agent loops.
