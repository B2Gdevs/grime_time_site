'use client'

import type { ComponentPropsWithoutRef } from 'react'

import { CustomerLoginCard } from '@/components/auth/login/CustomerLoginCard'
import { cn } from '@/utilities/ui'

export function LoginForm({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <CustomerLoginCard />
    </div>
  )
}

export { LoginBrandMark } from '@/components/auth/LoginBrandMark'
