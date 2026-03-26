# Frontend and code-quality conventions

**Owner:** Engineering  
**Last reviewed:** 2026-03-26  
**Audience:** Internal implementation standards for Codex/Cursor work.

## Purpose

Set enforceable conventions so UI quality and maintainability do not drift while features ship quickly.

## UI conventions (portal + public)

1. Use icons intentionally on forms and action rows (field group headers, section tabs, state chips, and quick actions).
2. Avoid low-contrast/faded-first presentation for primary actions and primary data.
3. Prefer compact, scannable list/detail and tab/detail patterns for dense guidance content.
4. One primary CTA per section; secondary actions use ghost/outline hierarchy.
5. Keep customer and admin visual language consistent, but keep permissions/surfaces separate.

## Code conventions

1. **No magic string sprawl:** move repeated literals to constants or typed option arrays.
2. **Prefer typed enums/const unions:** shared status/stage/role values should live in one schema/constants module.
3. **File-size guardrails:**
   - target: keep new files under ~250 lines where practical
   - soft warning: >400 lines should trigger extraction review
   - hard review: >600 lines requires explicit rationale in PR notes/planning
4. **Extract reusable patterns:** shared table configs, filter parsers, badge mappers, and formatter helpers should live in utilities or feature modules.
5. **Separate concerns by layer:** route handlers orchestrate; heavy shaping/formatting logic belongs in lib modules.
6. **UI composition over monoliths:** split large page components into focused sections/hooks.

## Refactor triggers (when to stop adding and extract)

- Third repeated block of near-identical JSX or mapping logic.
- Third route using the same filter/query-param parsing.
- Growing switch/case or status mapping across multiple files.
- New feature requires touching >3 unrelated sections in a single large file.

## Suggested reusable modules to standardize

- `statusBadgeMeta` and icon maps
- shared query-param parsing for `/ops/*`
- shared section header/metric row components
- shared empty-state and skeleton patterns
- shared form section wrappers with icon + title + helper text

## Delivery policy

- New implementation slices should include at least one extraction/consolidation improvement when touching large files.
- Avoid “refactor everything” pauses; apply Boy Scout refactors per touched surface.
- Add lint/static checks later if needed, but start with planning-backed enforcement in tasks/reviews.

## Review checklist

- Are key UI actions obvious without reading long paragraphs?
- Are repeated literals centralized?
- Did touched files exceed size guardrails without extraction?
- Was at least one reusable pattern extracted if duplication increased?
- Did changes preserve customer/admin boundary rules?
