import type { Metadata } from 'next'

import { ContactRequestForm } from '@/components/forms/ContactRequestForm'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Send a message to Grime Time.',
}

export default function ContactPage() {
  return (
    <main className="container max-w-xl py-16 sm:py-20 lg:py-24">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Contact</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We usually reply within one business day.
      </p>
      <div className="mt-8">
        <ContactRequestForm />
      </div>
    </main>
  )
}
