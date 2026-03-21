'use client'

import { useEffect, useRef } from 'react'

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
  }
}

type Props = { formId: string }

/**
 * EngageHub scheduling / form embed. Requires `EngageBayTracking` (ehform.js) in the layout.
 */
export function EngageBayScheduleFormClient({ formId }: Props) {
  const registered = useRef(false)

  useEffect(() => {
    if (registered.current) return
    registered.current = true
    ;(window.EhDynamicRef ||= []).push(() => {
      window.EhForms?.create({
        formId,
        target: '',
        onFormReady() {
          /* optional: setValue("email", "hello@example.com") */
        },
      })
    })
  }, [formId])

  return (
    <div
      className="engage-hub-form-embed min-h-[24rem] w-full max-w-3xl"
      id={`eh_form_${formId}`}
      data-id={formId}
    />
  )
}
