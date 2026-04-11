# Todo: email-driven-block-proposals

**Captured:** 2026-04-10
**Area:** block lab / payload / automation
**Urgency:** normal

## What

Explore an email-driven block proposal flow where a prompt sent by email can
generate a draft component or block proposal, surface a preview in the block
lab, and only become available to staff or public pages after explicit
approval.

## Why

This would let block ideas start from a lightweight inbox workflow without
skipping review. The important constraint is that generated blocks should stay
proposal-shaped until a human approves the preview and promotion path.

## Context

- The current block lab is now split between fixture-first previews and a
  Payload-backed `Live` tab for real page blocks.
- We are intentionally not committing to the email flow yet because the studio
  itself still needs more hands-on use before we lock the proposal contract.
- Related current work is still `19-02`: page-composer media-slot reliability.
  The studio is meant to help debug that work, not distract from it.

## Suggested next action

Revisit this after the live studio loop feels stable. Start by modeling
`block proposals` as first-party Payload records with preview payload,
approval status, source prompt, and promotion history before deciding whether
email should be the first creation surface.
