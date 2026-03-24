import type { Media } from '@/payload-types'

/** Stock photo used as seed only — replace with your own before/after shots in admin when ready. */
export const imageSeedDriveway: Omit<Media, 'createdAt' | 'id' | 'updatedAt'> = {
  alt: 'Concrete driveway and walkway — surface prep and rinse after soft-wash treatment',
}
