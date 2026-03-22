import path from 'path'

/** Supabase Storage S3 API base: `https://<ref>.supabase.co/storage/v1/s3` */
export function getSupabaseS3Endpoint(): string | undefined {
  const explicit = process.env.SUPABASE_S3_ENDPOINT?.trim()
  if (explicit) return explicit
  const base = process.env.SUPABASE_URL?.trim().replace(/\/$/, '')
  if (!base) return undefined
  return `${base}/storage/v1/s3`
}

/** Public object URL for a **public** bucket (use with bucket policy "public" or equivalent). */
export function getSupabasePublicObjectUrl(filename: string, prefix?: string): string {
  const base = (
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    ''
  ).replace(/\/$/, '')
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || 'media'
  const key = path.posix.join(prefix || '', filename)
  return `${base}/storage/v1/object/public/${bucket}/${key}`
}

export function isSupabaseMediaStorageConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_S3_ACCESS_KEY_ID?.trim() &&
      process.env.SUPABASE_S3_SECRET_ACCESS_KEY?.trim() &&
      getSupabaseS3Endpoint(),
  )
}
