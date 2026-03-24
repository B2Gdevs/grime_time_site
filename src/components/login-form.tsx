'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Droplets } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/utilities/ui'

function readErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    if ('error' in payload && typeof payload.error === 'string') return payload.error
    if ('message' in payload && typeof payload.message === 'string') return payload.message
    if (
      'errors' in payload &&
      Array.isArray(payload.errors) &&
      payload.errors[0] &&
      typeof payload.errors[0] === 'object' &&
      payload.errors[0] &&
      'message' in payload.errors[0] &&
      typeof payload.errors[0].message === 'string'
    ) {
      return payload.errors[0].message
    }
  }

  return fallback
}

function resolvePostLoginPath(payload: unknown, fallbackPath: string): string {
  const roles =
    payload &&
    typeof payload === 'object' &&
    'user' in payload &&
    payload.user &&
    typeof payload.user === 'object' &&
    'roles' in payload.user
      ? payload.user.roles
      : null

  const normalizedRoles = Array.isArray(roles)
    ? roles
    : typeof roles === 'string'
      ? [roles]
      : []

  if (normalizedRoles.includes('admin')) {
    return fallbackPath === '/dashboard' ? '/ops' : fallbackPath
  }

  return fallbackPath
}

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const router = useRouter()
  const search = useSearchParams()
  const nextPath = search.get('next') || '/dashboard'

  const [loginPending, setLoginPending] = useState(false)
  const [registerPending, setRegisterPending] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [registerError, setRegisterError] = useState<string | null>(null)

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoginPending(true)
    setLoginError(null)

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '').trim().toLowerCase()
    const password = String(form.get('password') || '')

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(readErrorMessage(payload, 'Could not sign in. Check your email and password.'))
      }

      router.push(resolvePostLoginPath(payload, nextPath))
      router.refresh()
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Could not sign in.')
    } finally {
      setLoginPending(false)
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRegisterPending(true)
    setRegisterError(null)

    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') || '').trim()
    const email = String(form.get('email') || '').trim().toLowerCase()
    const password = String(form.get('password') || '')

    try {
      const registerResponse = await fetch('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      })

      const registerPayload = await registerResponse.json().catch(() => null)

      if (!registerResponse.ok) {
        throw new Error(readErrorMessage(registerPayload, 'Could not create your account.'))
      }

      const loginResponse = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const loginPayload = await loginResponse.json().catch(() => null)

      if (!loginResponse.ok) {
        throw new Error(
          readErrorMessage(
            loginPayload,
            'Your account was created, but automatic sign-in failed. Try signing in manually.',
          ),
        )
      }

      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : 'Could not create your account.')
    } finally {
      setRegisterPending(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Customer account</CardTitle>
          <CardDescription>Sign in to review your account, docs, scheduling, and next steps.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sign-in" className="grid gap-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sign-in">Sign in</TabsTrigger>
              <TabsTrigger value="create-account">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="sign-in">
              <form className="grid gap-4" onSubmit={handleLogin}>
                <div className="grid gap-2 text-left">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" name="email" type="email" autoComplete="email" required />
                </div>
                <div className="grid gap-2 text-left">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </div>
                {loginError ? (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {loginError}
                  </div>
                ) : null}
                <Button className="w-full" disabled={loginPending} type="submit">
                  {loginPending ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="create-account">
              <form className="grid gap-4" onSubmit={handleRegister}>
                <div className="grid gap-2 text-left">
                  <Label htmlFor="register-name">Name</Label>
                  <Input id="register-name" name="name" autoComplete="name" required />
                </div>
                <div className="grid gap-2 text-left">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="grid gap-2 text-left">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
                {registerError ? (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {registerError}
                  </div>
                ) : null}
                <Button className="w-full" disabled={registerPending} type="submit">
                  {registerPending ? 'Creating account...' : 'Create account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <p className="text-balance text-center text-xs text-muted-foreground">
        By continuing you agree to follow your organization&apos;s access policies for this site.
      </p>
    </div>
  )
}

/** Brand row for the public login page (shadcn login-03 header). */
export function LoginBrandMark() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 self-center text-sm font-medium text-foreground hover:opacity-90"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Droplets className="size-4" aria-hidden />
      </div>
      Grime Time
    </Link>
  )
}
