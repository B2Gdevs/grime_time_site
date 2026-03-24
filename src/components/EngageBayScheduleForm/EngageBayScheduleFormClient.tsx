'use client'

import { useEffect, useRef, useState } from 'react'

import { AlertTriangleIcon, LoaderCircleIcon } from 'lucide-react'

declare global {
  interface Window {
    EhDynamicRef?: Array<() => void>
    EhForms?: {
      create: (opts: {
        formId: string
        target?: string
        onFormReady?: (el: unknown, setValue: (field: string, value: string) => void) => void
      }) => void
    }
    EhAPI?: {
      after_load?: () => void
    }
  }
}

type Props = {
  formId: string
  hasAccountConfig: boolean
}

const ENGAGEBAY_SCRIPT_SRC = 'https://d2p078bqz5urf7.cloudfront.net/jsapi/ehform.js'

function ensureEhFormScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.EhForms) return Promise.resolve()

  const existing = document.querySelector<HTMLScriptElement>('script[data-engagebay-ehform="true"]')
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Could not load EngageBay scheduler.')), {
        once: true,
      })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.async = true
    script.dataset.engagebayEhform = 'true'
    script.src = `${ENGAGEBAY_SCRIPT_SRC}?v=${new Date().getUTCHours()}`
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load EngageBay scheduler.'))
    document.head.appendChild(script)
  })
}

/**
 * EngageHub scheduling / form embed. Requires `EngageBayTracking` (ehform.js) in the layout.
 */
export function EngageBayScheduleFormClient({ formId, hasAccountConfig }: Props) {
  const registered = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (registered.current) return
    registered.current = true

    let cancelled = false
    const target = `#eh_form_${formId}`

    const mountScheduler = async () => {
      try {
        if (!hasAccountConfig) {
          setError(
            'EngageBay scheduler needs ENGAGEBAY_JS_FORM_REF (or ENGAGEBAY_JS_TRACKING_KEY in key|formRef format) before the embed can render.',
          )
          setLoading(false)
          return
        }

        window.EhAPI = window.EhAPI || {}
        window.EhAPI.after_load = window.EhAPI.after_load || (() => {})

        await ensureEhFormScript()

        if (cancelled) return

        const formHost = document.querySelector<HTMLElement>(target)
        if (!formHost) {
          throw new Error('Scheduler target element is missing.')
        }

        formHost.innerHTML = ''
        window.EhForms?.create({
          formId,
          target,
          onFormReady() {
            if (!cancelled) {
              setError(null)
              setLoading(false)
            }
          },
        })

        window.setTimeout(() => {
          if (cancelled) return
          const hasRenderedContent = Boolean(formHost.children.length || formHost.querySelector('iframe, form'))
          if (!hasRenderedContent) {
            setError(
              'EngageBay did not render the booking form. Recheck ENGAGEBAY_SCHEDULE_FORM_ID and the EngageBay form ref settings, then restart dev.',
            )
          }
          setLoading(false)
        }, 3500)
      } catch (mountError) {
        if (!cancelled) {
          setError(
            mountError instanceof Error ? mountError.message : 'Could not initialize EngageBay scheduler.',
          )
          setLoading(false)
        }
      }
    }

    void mountScheduler()

    return () => {
      cancelled = true
    }
  }, [formId, hasAccountConfig])

  return (
    <div className="grid gap-4">
      <div
        className="engage-hub-form-embed min-h-[28rem] w-full rounded-[1.5rem] border border-border/80 bg-background/80 p-2 shadow-sm"
        id={`eh_form_${formId}`}
        data-id={formId}
      />

      {loading && !error ? (
        <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card/80 px-4 py-3 text-sm text-muted-foreground">
          <LoaderCircleIcon className="size-4 animate-spin text-primary" />
          Loading scheduler...
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-4 text-sm text-foreground">
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <div className="grid gap-2">
            <p className="font-medium">Scheduler needs attention</p>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
