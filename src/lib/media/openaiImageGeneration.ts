/**
 * Shared OpenAI image generation for admin API route and CLI scripts.
 * Server-only: uses env keys, never import from client bundles.
 */
export type OpenAIImageFormat = 'png' | 'jpeg' | 'webp'

export async function generateOpenAIImage({
  model,
  output_format,
  prompt,
  quality,
  size,
}: {
  model: string
  output_format: OpenAIImageFormat
  prompt: string
  quality?: string
  size?: string
}): Promise<{ buffer: Buffer; contentType: string; extension: string }> {
  const apiKey =
    process.env.PROVIDERS__OPENAI__API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim()

  const baseUrl = process.env.PROVIDERS__OPENAI__BASE_URL?.trim() || 'https://api.openai.com/v1'
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured (PROVIDERS__OPENAI__API_KEY / OPENAI_API_KEY).')
  }

  const res = await fetch(`${baseUrl}/images/generations`, {
    body: JSON.stringify({
      model,
      n: 1,
      output_format,
      prompt,
      quality,
      size,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OpenAI image generation failed: ${res.status} ${text}`.trim())
  }

  const json = (await res.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>
  }
  const created = json?.data?.[0]
  const b64 = created?.b64_json
  const url = created?.url

  let buffer: Buffer
  if (typeof b64 === 'string' && b64.length > 0) {
    buffer = Buffer.from(b64, 'base64')
  } else if (typeof url === 'string' && url.length > 0) {
    const imgRes = await fetch(url)
    if (!imgRes.ok) {
      throw new Error(`OpenAI image fetch failed: ${imgRes.status}`)
    }
    const arr = await imgRes.arrayBuffer()
    buffer = Buffer.from(arr)
  } else {
    throw new Error('OpenAI image generation returned no b64_json/url.')
  }

  const extension = output_format
  const contentType =
    output_format === 'png' ? 'image/png' : output_format === 'jpeg' ? 'image/jpeg' : 'image/webp'

  return { buffer, contentType, extension }
}
