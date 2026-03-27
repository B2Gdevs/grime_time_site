'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { toast } from '@payloadcms/ui'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const DEFAULT_PROMPT =
  'Professional, ultra-realistic exterior cleaning photograph. Clean bright daylight. Residential driveway and walkway after cleaning, crisp details, natural colors, no text, no logos.'

export default function PromptToMediaField(_props: unknown) {
  const [prompt, setPrompt] = useState<string>(DEFAULT_PROMPT)
  const [loading, setLoading] = useState(false)

  const altPreview = useMemo(() => prompt.trim().slice(0, 80) || 'Generated media', [prompt])

  const onGenerate = useCallback(async () => {
    const trimmed = prompt.trim()
    if (!trimmed) {
      toast.error('Prompt is required.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/internal/media/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed, alt: altPreview }),
        credentials: 'include',
      })

      const payload = (await res.json().catch(() => null)) as null | { id?: string | number; error?: string }
      if (!res.ok) {
        throw new Error(payload?.error || 'Image generation failed.')
      }

      const id = payload?.id
      if (id == null) {
        throw new Error('Image generation succeeded but no media id was returned.')
      }

      // Payload edit URL: `/admin/collections/{slug}/{id}`
      window.location.assign(`/admin/collections/media/${id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [altPreview, prompt])

  return (
    <div className="grid gap-3 rounded-lg border bg-card p-4">
      <div className="text-sm font-medium">Generate new media from a prompt</div>
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the image you want…"
        rows={4}
      />
      <div className="text-xs text-muted-foreground">
        Alt will default to the first ~80 characters of the prompt: <span className="font-medium">{altPreview}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" onClick={onGenerate} disabled={loading}>
          {loading ? 'Generating…' : 'Generate image + create media'}
        </Button>
      </div>
    </div>
  )
}

