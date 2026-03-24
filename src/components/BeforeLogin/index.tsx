import React from 'react'

import { AdminLoginPanel } from '@/components/AdminLoginPanel'

/** Payload admin `beforeLogin` — shadcn login-03–style card (see `AdminLoginPanel`). */
const BeforeLogin: React.FC = () => {
  return (
    <div className="mx-auto mb-6 w-full max-w-sm">
      <AdminLoginPanel />
    </div>
  )
}

export default BeforeLogin
