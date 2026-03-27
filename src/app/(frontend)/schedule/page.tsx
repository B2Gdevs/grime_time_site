'use client'

import { useEffect } from 'react'

export default function SchedulePage() {
  useEffect(() => {
    window.location.replace('/#instant-quote')
  }, [])

  return (
    <div className="container py-24 text-center text-sm text-muted-foreground">
      Redirecting to the instant quote form…
    </div>
  )
}
