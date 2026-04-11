declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PAYLOAD_SECRET?: string
      SEED_LOGIN_EMAIL?: string
      SEED_LOGIN_PASSWORD?: string
      DATABASE_URL: string
      NEXT_PUBLIC_SERVER_URL: string
      VERCEL_PROJECT_PRODUCTION_URL: string
      VERCEL_URL?: string
      QUOTES_INTERNAL_ENABLED?: string
      QUOTES_INTERNAL_EMAILS?: string
      ADMIN_EMAIL?: string
      ADMIN_PASSWORD?: string
      ADMIN_NAME?: string
      SUPABASE_URL?: string
      NEXT_PUBLIC_SUPABASE_URL?: string
      NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?: string
      CLERK_SECRET_KEY?: string
      PAYLOAD_OAUTH_ALLOWED_EMAILS?: string
      SUPABASE_STORAGE_BUCKET?: string
      SUPABASE_S3_ACCESS_KEY_ID?: string
      SUPABASE_S3_SECRET_ACCESS_KEY?: string
      SUPABASE_S3_ENDPOINT?: string
      SUPABASE_S3_REGION?: string
      RESEND_API_KEY?: string
      RESEND_WEBHOOK_SECRET?: string
      EMPLOYEE_NOTIFICATION_EMAILS?: string
      STRIPE_SECRET_KEY?: string
      STRIPE_ACCOUNT_ID?: string
      STRIPE_WEBHOOK_SECRET?: string
      EMAIL_FROM?: string
      EMAIL_FROM_NAME?: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
