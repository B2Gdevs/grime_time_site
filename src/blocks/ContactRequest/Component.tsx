import { ContactGuidancePanel } from '@/components/contact/ContactGuidancePanel'
import { ContactRequestForm } from '@/components/forms/ContactRequestForm'

/** CMS block: first-party contact surface (tabs + form). Hero/title live in the page hero. */
export function ContactRequestBlock() {
  return (
    <div className="container py-8 lg:py-12">
      <div className="overflow-hidden rounded-[2rem] border border-border bg-card/60 shadow-[0_20px_70px_-50px_rgba(15,23,42,0.45)]">
        <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-start lg:p-8">
          <div className="grid content-start gap-4">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">Contact</p>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Quick contact</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Need help with billing, scheduling, policy, or a general question? Send a short
              message and the team replies fast.
            </p>
            <ContactGuidancePanel />
          </div>

          <div>
            <ContactRequestForm />
          </div>
        </div>
      </div>
    </div>
  )
}
