# AI ops assistant (beta) - planning spec

**Owner:** TBD  
**Last reviewed:** 2026-04-01  
**Tools:** OpenAI API, Vercel AI SDK, Assistant UI, Tool UI patterns, local embeddings, Payload-native CRM and ops APIs  
**Planning:** DECISIONS `D-ai-001`, `D-ai-002`, TASK-REGISTRY phase `08`, `.planning/phases/08-ai-ops-assistant/`

## Purpose

Optional **staff-only** employee copilot to speed up **business operations**: understanding quotes, CRM records, internal playbooks, current assigned work, and follow-up actions. It should feel like the portfolio site copilot translated into an employee ops surface, not like a generic support chat widget. It is not a replacement for Payload as system of record.

## Product rules

- **Beta:** Visible **Beta** label in the assistant UI; no implied SLA.
- **Feature flag:** Off by default in production; enable via env (see `08-01`).
- **Audience:** Authenticated **staff / admin** only; not exposed on public marketing routes as a customer concierge unless explicitly redesigned.
- **Scope:** Business ops Q&A, doc-grounded answers (RAG), read-first tool calls, and assistant-rendered components for "what should I do next?" workflows.
- **Write policy:** Writes stay gated behind explicit user confirmation and tight allowlists in early versions.
- **Tours:** Tours stay first-party Joyride tours. The copilot can launch them or deep-link into them, but does not replace the tour system.

## Architecture (target)

1. **Employee copilot shell**  
   Assistant UI plus Tool UI-compatible components, streaming via Vercel AI SDK, placed in the staff portal and visually modeled after the portfolio copilot instead of a plain admin chat box.

2. **RAG**  
   Reuse the same internal-docs retrieval mindset as the portfolio site and Magicborn CLI flow: approved docs only, deterministic ingestion, and cheap local embeddings by default for development and baseline production efficiency.

3. **Rendered ops components**  
   The assistant should be able to return compact UI components in-chat for:
   - current logged-in employee tasks
   - follow-up contacts and stale leads
   - quote or CRM record summaries
   - launch-tour actions
   - suggested next steps tied to the current staff user

4. **Tools**  
   Read-first internal APIs first: quote lookup, CRM search, assigned tasks, follow-up queue, and tour-launch intents. Expand carefully to writes only after explicit confirmation flows exist.

5. **Vision (later / optional)**  
   Image upload -> model extracts phone numbers or text -> user confirms -> create or match lead / quote request. Supports "contacts in phone Notes" style input without manual retyping.

## RAG baseline

- **Sources:** start with internal docs under `src/content/docs/`, approved playbooks in `.planning/workflows/`, and tightly selected operator docs only.
- **Ingestion:** prefer the same authored-docs-first ingestion discipline used in the portfolio repo. Do not create a second bespoke ingestion model if the portfolio/Magicborn pattern can be adapted.
- **Embeddings:** default to the same cheap local embedding setup used in the portfolio repo: `RAG_EMBEDDING_PROVIDER=local`, `RAG_LOCAL_EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2`, `RAG_LOCAL_EMBEDDING_DIMENSIONS=384`.
- **Storage:** keep retrieval and storage compatible with the app's existing Postgres/Payload direction rather than introducing an unrelated vector SaaS by default.
- **Scope control:** only ingest docs approved for staff guidance; no raw customer-communications dump, no uncontrolled admin tables, no broad "index everything" pass.

## UX target

- **Feel:** similar to the portfolio site copilot, but for employees.
- **Placement:** available from the staff portal shell, especially `/ops` and `/ops/workspace`.
- **Behavior:** good at answering "what should I do now?", surfacing a compact prioritized queue, and turning documentation into action.
- **Rendering:** prefer assistant-rendered cards, action rows, and source blocks over long text walls when the answer is operational.
- **Identity-aware:** the assistant should know the current effective staff user and shape follow-up/task answers around that person's assignments and privileges.

## Security and compliance

- Redact or avoid logging raw phone numbers and message content in app logs; prefer structured IDs.
- Rate limits, cost caps, kill switch (env off).
- Audit trail for tool invocations that touch customer data.
- Keep the assistant staff-only until a separate customer-facing product decision exists.
- Tour launch actions, task surfacing, and follow-up queues must honor the same auth scope and impersonation rules as the rest of the portal.

## References

- Phase plan: `.planning/phases/08-ai-ops-assistant/PLAN.xml`
- Tours remain separate (Joyride); optional future tour for "AI beta" when UI stabilizes is tracked under `.planning/BLOCKERS.xml` `BLK-tour-ai-001`.
- Portfolio references:
  - `apps/portfolio/app/api/chat/route.ts`
  - `apps/portfolio/components/site/SiteCopilot.tsx`
  - `apps/portfolio/components/site/SiteCopilotContext.tsx`
  - `apps/portfolio/lib/rag/`
