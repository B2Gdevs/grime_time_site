import { ContactRequestForm } from '@/components/forms/ContactRequestForm'

/** CMS block: first-party contact form → `/api/lead-forms/contact`. */
export function ContactRequestBlock() {
  return (
    <div className="container py-8 lg:py-12">
      <div className="mx-auto max-w-xl">
        <h2 className="text-2xl font-semibold tracking-tight">Contact</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We usually reply within one business day.
        </p>
        <div className="mt-6">
          <ContactRequestForm />
        </div>
      </div>
    </div>
  )
}
