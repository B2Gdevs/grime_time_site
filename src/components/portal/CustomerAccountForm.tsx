'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2Icon, LoaderCircleIcon, SaveIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { customerAccountSchema, type CustomerAccountValues } from '@/lib/forms/customerAccount'

type Props = {
  defaultValues: CustomerAccountValues
}

export function CustomerAccountForm({ defaultValues }: Props) {
  const [serverMessage, setServerMessage] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const form = useForm<CustomerAccountValues>({
    resolver: zodResolver(customerAccountSchema),
    defaultValues,
  })

  async function onSubmit(values: CustomerAccountValues) {
    setSaved(false)
    setServerMessage(null)

    try {
      const response = await fetch('/api/portal/account', {
        body: JSON.stringify(values),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const body = (await response.json().catch(() => ({}))) as { error?: string; message?: string }
      if (!response.ok) {
        throw new Error(body.error || 'Could not update your account right now.')
      }

      setSaved(true)
      setServerMessage(body.message || 'Account updated.')
    } catch (error) {
      setSaved(false)
      setServerMessage(error instanceof Error ? error.message : 'Could not update your account right now.')
    }
  }

  return (
    <Form {...form}>
      <form className="grid gap-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Your full name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Optional company name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="you@example.com" type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="(555) 555-5555" type="tel" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="grid gap-4 rounded-2xl border p-4">
            <div>
              <h3 className="font-medium">Billing address</h3>
              <p className="text-sm text-muted-foreground">Used for invoice delivery and account records.</p>
            </div>
            <FormField
              control={form.control}
              name="billingAddress.street1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="123 Main St" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="billingAddress.street2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street 2</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Suite, gate, or unit" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 md:grid-cols-[1.4fr_0.7fr_0.9fr]">
              <FormField
                control={form.control}
                name="billingAddress.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billingAddress.state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billingAddress.postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="grid gap-4 rounded-2xl border p-4">
            <div>
              <h3 className="font-medium">Service address</h3>
              <p className="text-sm text-muted-foreground">Used for estimates, scheduling, and route planning.</p>
            </div>
            <FormField
              control={form.control}
              name="serviceAddress.street1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="123 Main St" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="serviceAddress.street2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street 2</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Gate code, dock note, or unit" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 md:grid-cols-[1.4fr_0.7fr_0.9fr]">
              <FormField
                control={form.control}
                name="serviceAddress.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serviceAddress.state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serviceAddress.postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {serverMessage ? (
          <div
            className={
              saved
                ? 'flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-4 text-sm'
                : 'rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-4 text-sm text-destructive'
            }
          >
            {saved ? <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" /> : null}
            <div className={saved ? 'text-foreground' : ''}>{serverMessage}</div>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Keep this current so estimates, invoices, and service-day updates go to the right place.
          </p>
          <Button disabled={form.formState.isSubmitting} type="submit">
            {form.formState.isSubmitting ? (
              <>
                <LoaderCircleIcon className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <SaveIcon className="size-4" />
                Save account
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
