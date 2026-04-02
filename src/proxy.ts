import { NextResponse } from 'next/server'
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware(async (auth, request) => {
  if (request.nextUrl.pathname === '/admin/login') {
    const session = await auth()

    if (session.userId) {
      const bridgeURL = new URL('/api/internal/admin/payload-session', request.url)
      bridgeURL.searchParams.set('next', '/admin')

      return NextResponse.redirect(bridgeURL)
    }
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
