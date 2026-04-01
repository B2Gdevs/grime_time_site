const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() || ''
const clerkSecretKey = process.env.CLERK_SECRET_KEY?.trim() || ''

export function isClerkClientConfigured() {
  return Boolean(clerkPublishableKey)
}

export function isClerkServerConfigured() {
  return Boolean(clerkPublishableKey && clerkSecretKey)
}
