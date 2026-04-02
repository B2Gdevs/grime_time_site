/**
 * Shared OpenAI video generation for local media tools.
 * Server-only: uses env keys, never import from client bundles.
 */

function getOpenAIConfig() {
  const apiKey = process.env.PROVIDERS__OPENAI__API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim()
  const baseUrl = process.env.PROVIDERS__OPENAI__BASE_URL?.trim() || 'https://api.openai.com/v1'

  if (!apiKey) {
    throw new Error('OpenAI API key is not configured (PROVIDERS__OPENAI__API_KEY / OPENAI_API_KEY).')
  }

  return { apiKey, baseUrl }
}

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export async function generateOpenAIVideo({
  inputReference,
  model = 'sora-2',
  prompt,
  seconds = '4',
  size = '1280x720',
}: {
  inputReference?: {
    contentType: string
    data: Buffer
    filename: string
  } | null
  model?: string
  prompt: string
  seconds?: '4' | '8' | '12'
  size?: '1280x720' | '720x1280'
}): Promise<{ buffer: Buffer; contentType: string; extension: string }> {
  const { apiKey, baseUrl } = getOpenAIConfig()

  const createResponse = await fetch(`${baseUrl}/videos`, {
    body: JSON.stringify({
      input_reference: inputReference
        ? {
            image_url: `data:${inputReference.contentType};base64,${inputReference.data.toString('base64')}`,
          }
        : undefined,
      model,
      prompt,
      seconds,
      size,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!createResponse.ok) {
    const text = await createResponse.text().catch(() => '')
    throw new Error(`OpenAI video generation failed: ${createResponse.status} ${text}`.trim())
  }

  const created = (await createResponse.json()) as { id?: string; status?: string }
  const videoId = created.id?.trim()

  if (!videoId) {
    throw new Error('OpenAI video generation returned no id.')
  }

  const maxAttempts = 60

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const statusResponse = await fetch(`${baseUrl}/videos/${videoId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      method: 'GET',
    })

    if (!statusResponse.ok) {
      const text = await statusResponse.text().catch(() => '')
      throw new Error(`OpenAI video status failed: ${statusResponse.status} ${text}`.trim())
    }

    const statusPayload = (await statusResponse.json()) as {
      error?: { message?: string }
      status?: string
    }

    if (statusPayload.status === 'completed') {
      const contentResponse = await fetch(`${baseUrl}/videos/${videoId}/content`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        method: 'GET',
      })

      if (!contentResponse.ok) {
        const text = await contentResponse.text().catch(() => '')
        throw new Error(`OpenAI video fetch failed: ${contentResponse.status} ${text}`.trim())
      }

      const buffer = Buffer.from(await contentResponse.arrayBuffer())
      return {
        buffer,
        contentType: 'video/mp4',
        extension: 'mp4',
      }
    }

    if (statusPayload.status === 'failed' || statusPayload.status === 'cancelled') {
      throw new Error(statusPayload.error?.message || `OpenAI video generation ${statusPayload.status}.`)
    }

    await wait(5000)
  }

  throw new Error('OpenAI video generation timed out while waiting for completion.')
}
