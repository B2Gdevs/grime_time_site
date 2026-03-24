import type { Media } from '@/payload-types'

/** Stock photo used as seed only — replace with your own job photos in admin when ready. */
export const imageSeedHouse: Omit<Media, 'createdAt' | 'id' | 'updatedAt'> = {
  alt: 'Residential home with siding and driveway — example of a typical exterior cleaning project',
}
