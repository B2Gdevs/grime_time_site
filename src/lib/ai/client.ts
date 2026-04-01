import type { CopilotConversationMessage } from './types'

const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions'

function extractCompletionText(payload: unknown): string {
  const content = (payload as { choices?: Array<{ message?: { content?: unknown } }> })?.choices?.[0]?.message?.content

  if (typeof content === 'string') {
    return content.trim()
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part
        if (
          part
          && typeof part === 'object'
          && (part as { type?: string }).type === 'text'
          && typeof (part as { text?: string }).text === 'string'
        ) {
          return (part as { text: string }).text
        }
        return ''
      })
      .join('')
      .trim()
  }

  return ''
}

export async function createCopilotChatCompletion(args: {
  apiKey: string
  model: string
  messages: CopilotConversationMessage[]
  signal?: AbortSignal
}): Promise<string> {
  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    body: JSON.stringify({
      messages: args.messages,
      model: args.model,
      temperature: 0.4,
    }),
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    signal: args.signal,
  })

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    throw new Error(details || 'The upstream chat provider returned an error.')
  }

  const payload = await response.json()
  return extractCompletionText(payload)
}
