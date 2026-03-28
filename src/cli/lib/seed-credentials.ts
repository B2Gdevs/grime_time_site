export function resolveSeedCredentials():
  | { email: string; password: string; source: 'admin' | 'seed' }
  | null {
  const seedEmail = process.env.SEED_LOGIN_EMAIL?.trim().toLowerCase()
  const seedPassword = process.env.SEED_LOGIN_PASSWORD?.trim()
  if (seedEmail && seedPassword) {
    return { email: seedEmail, password: seedPassword, source: 'seed' }
  }
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const adminPassword = process.env.ADMIN_PASSWORD?.trim()
  if (adminEmail && adminPassword) {
    return { email: adminEmail, password: adminPassword, source: 'admin' }
  }
  return null
}
