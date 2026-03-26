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

## Measurable thresholds (DRY + SOLID guardrails)

1. **Repeated literals threshold:** if the same non-trivial literal appears 2+ times in a feature area, extract before adding a 3rd occurrence.
2. **Repeated UI block threshold:** if near-identical JSX appears 2+ times, extract a component before a 3rd variation.
3. **Repeated mapping/branch logic threshold:** if status/stage mapping appears in 2+ files, extract one shared mapper/meta table.
4. **Route parsing threshold:** if query-param parsing logic is reused in 2 routes, move to a shared parser utility.
5. **File-size thresholds:**
   - warning at 400 lines (open extraction task/checklist)
   - required split rationale at 600+ lines
6. **Function-size threshold:** functions over ~60 lines should be reviewed for extraction and single-responsibility clarity.
7. **Dependency direction check:** route/page layers depend on feature/lib utilities; utility modules should not depend on route/page components.

## Refactor triggers (when to stop adding and extract)

- Third repeated block of near-identical JSX or mapping logic.
- Third route using the same filter/query-param parsing.
- Growing switch/case or status mapping across multiple files.
- New feature requires touching >3 unrelated sections in a single large file.
- New work introduces duplicate branch conditions for roles/status/stage already handled elsewhere.

## Suggested reusable modules to standardize

- `statusBadgeMeta` and icon maps
- shared query-param parsing for `/ops/*`
- shared section header/metric row components
- shared empty-state and skeleton patterns
- shared form section wrappers with icon + title + helper text
- shared validation schema fragments for repeated form field groups
- shared navigation label/context builders (admin vs preview/customer)

## Design patterns to incorporate more

1. **Configuration-driven UI:** use metadata objects for badges, icons, labels, and quick actions instead of switch/case spread across components.
2. **List-detail shell pattern:** stable left list + right detail panel (or tab/detail) for dense operational views.
3. **Feature module pattern:** keep each domain (`crm`, `billing`, `portal`) with colocated `types`, `constants`, `mappers`, `queries`, and `ui`.
4. **Policy object pattern:** encode SLA, escalation, and discount precedence in typed policy objects rather than inline condition chains.
5. **Presenter/mapper pattern:** convert raw Payload docs into view models in lib layers, so components stay mostly declarative.
6. **Action handler pattern:** centralize route mutation intent handling by action kind (e.g., task transitions) with explicit typed payloads.
7. **Query-param state pattern:** use typed parsers/serializers for `/ops/*` deep links and filters.
8. **Template + token pattern for messaging:** reminder templates use typed tokens and renderer utilities, not ad hoc string concatenation.

## Delivery policy

- New implementation slices should include at least one extraction/consolidation improvement when touching large files.
- Avoid “refactor everything” pauses; apply Boy Scout refactors per touched surface.
- Add lint/static checks later if needed, but start with planning-backed enforcement in tasks/reviews.
- For each feature slice, include at least one convention-compliance check item in implementation notes.

## Review checklist

- Are key UI actions obvious without reading long paragraphs?
- Are repeated literals centralized?
- Did touched files exceed size guardrails without extraction?
- Was at least one reusable pattern extracted if duplication increased?
- Did changes preserve customer/admin boundary rules?
- Did repeated literals cross thresholds without extraction?
- Did the implementation reuse existing feature patterns before adding new one-off logic?
