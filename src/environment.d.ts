declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PAYLOAD_SECRET: string
      DATABASE_URL: string
      NEXT_PUBLIC_SERVER_URL: string
      VERCEL_PROJECT_PRODUCTION_URL: string
      ENGAGEBAY_JS_TRACKING_KEY?: string
      ENGAGEBAY_JS_FORM_REF?: string
      ENGAGEBAY_SCHEDULE_FORM_ID?: string
      ENGAGEBAY_API_KEY?: string
      ENGAGEBAY_SYNC_FORM_SUBMISSIONS?: string
      ENGAGEBAY_SUBMISSION_TAG?: string
      ENGAGEBAY_ATTACH_SUBMISSION_NOTE?: string
      QUOTES_INTERNAL_ENABLED?: string
      QUOTES_INTERNAL_EMAILS?: string
      SUPABASE_URL?: string
      NEXT_PUBLIC_SUPABASE_URL?: string
      SUPABASE_STORAGE_BUCKET?: string
      SUPABASE_S3_ACCESS_KEY_ID?: string
      SUPABASE_S3_SECRET_ACCESS_KEY?: string
      SUPABASE_S3_ENDPOINT?: string
      SUPABASE_S3_REGION?: string
      RESEND_API_KEY?: string
      EMAIL_FROM?: string
      EMAIL_FROM_NAME?: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
