import type { CopilotRagHit } from './types'

function clip(value: string, limit = 480): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= limit) return normalized
  return `${normalized.slice(0, limit)}...`
}

export const AI_OPS_ASSISTANT_INSTRUCTIONS = [
  'You are Grime Time Copilot, a staff-only operations assistant.',
  'Help Grime Time employees with CRM follow-up, quotes, scheduling context, billing follow-up, tours, and internal playbooks.',
  'Prefer concise operational answers over broad essays.',
  'If retrieved internal docs are relevant, ground your answer in them and say when you are relying on policy or playbook guidance.',
  'If the answer depends on records not present in the provided task/follow-up panels or retrieved docs, say what is missing instead of inventing it.',
  'Do not expose customer-facing framing. You are helping employees work the queue.',
].join('\n')

export function buildOpsRagSystemMessage(hits: CopilotRagHit[]): null | string {
  if (hits.length === 0) return null

  return [
    'Internal docs context:',
    ...hits.map((hit, index) => {
      const heading = hit.heading ? ` — ${hit.heading}` : ''
      return `[${index + 1}] ${hit.title}${heading}\n${clip(hit.content)}`
    }),
  ].join('\n\n')
}
