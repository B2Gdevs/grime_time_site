/**
 * Vercel/production builds must set `POSTGRES_URL`. Without it, `next build` skips
 * DB-backed `generateStaticParams` so CI/local builds can compile without a database.
 */
export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.POSTGRES_URL?.trim())
}
