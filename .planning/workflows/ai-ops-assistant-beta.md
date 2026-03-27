# AI ops assistant (beta) — planning spec

**Owner:** TBD  
**Last reviewed:** 2026-03-26  
**Tools:** OpenAI API, Vercel AI SDK, Assistant UI, Tool UI (patterns), optional Supabase `pgvector` or managed vector index  
**Planning:** DECISIONS `D-ai-001`, TASK-REGISTRY phase `08`, `.planning/phases/08-ai-ops-assistant/`

## Purpose

Optional **staff-only** assistant to speed up **business operations**: understanding quotes, CRM records, internal playbooks, and (later) structured capture from **screenshots** (e.g. phone numbers stored in Notes). Not a replacement for Payload as system of record.

## Product rules

- **Beta:** Visible **Beta** label in chat UI; no implied SLA.
- **Feature flag:** Off by default in production; enable via env (see `08-01`).
- **Audience:** Authenticated **staff / admin** only — not exposed on public marketing routes as a customer concierge unless explicitly redesigned.
- **Scope:** Business ops Q&amp;A, doc-grounded answers (RAG), read-first tool calls; **writes** (create lead, attach quote) only with explicit user confirmation and tight allowlists in early versions.

## Architecture (target)

1. **Chat shell** — Assistant UI + Tool UI-compatible components, streaming via Vercel AI SDK.
2. **RAG** — Embeddings of approved sources: portal docs (`src/content/docs/`), selected admin playbooks; re-ingest on change.
3. **Tools** — Read-only internal APIs first (quote lookup, CRM search); expand carefully.
4. **Vision (optional)** — Image upload → model extracts phone numbers / text → user confirms → create or match lead / quote request. Supports “contacts in phone Notes” style input without manual retyping.

## Security and compliance

- Redact or avoid logging raw phone numbers and message content in app logs; prefer structured IDs.
- Rate limits, cost caps, kill switch (env off).
- Audit trail for tool invocations that touch customer data.

## References

- Phase plan: `.planning/phases/08-ai-ops-assistant/PLAN.xml`
- Tours remain separate (Joyride); optional future tour for “AI beta” when UI stabilizes — tracked under `.planning/BLOCKERS.xml` `BLK-tour-ai-001` (phase `08`), not portal tour backlog.
