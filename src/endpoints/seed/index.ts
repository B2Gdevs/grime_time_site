import type { CollectionSlug, GlobalSlug, Payload, PayloadRequest, File } from 'payload'

import { buildContactFormData } from './contact-form'
import { contact as contactPageData } from './contact-page'
import { home } from './home'
import { image1 } from './image-1'
import { image2 } from './image-2'
import { imageHero1 } from './image-hero-1'
import { post1 } from './post-1'
import { post2 } from './post-2'
import { post3 } from './post-3'

const collections: CollectionSlug[] = [
  'categories',
  'media',
  'pages',
  'posts',
  'forms',
  'form-submissions',
  'search',
]

const globals: GlobalSlug[] = ['header', 'footer', 'pricing']

const categories = ['Technology', 'News', 'Finance', 'Design', 'Software', 'Engineering']

// Next.js revalidation errors are normal when seeding the database without a server running
// i.e. running `yarn seed` locally instead of using the admin UI within an active app
// The app is not running to revalidate the pages and so the API routes are not available
// These error messages can be ignored: `Error hitting revalidate route for...`
export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding database...')

  // we need to clear the media directory before seeding
  // as well as the collections and globals
  // this is because while `yarn seed` drops the database
  // the custom `/api/seed` endpoint does not
  payload.logger.info(`— Clearing collections and globals...`)

  // clear the database
  await Promise.all(
    globals.map((global) => {
      if (global === 'pricing') {
        return payload.updateGlobal({
          slug: 'pricing',
          data: { sectionTitle: '', sectionIntro: '', plans: [] },
          depth: 0,
          context: { disableRevalidate: true },
        })
      }
      return payload.updateGlobal({
        slug: global,
        data: { navItems: [] },
        depth: 0,
        context: { disableRevalidate: true },
      })
    }),
  )

  await Promise.all(
    collections.map((collection) => payload.db.deleteMany({ collection, req, where: {} })),
  )

  await Promise.all(
    collections
      .filter((collection) => Boolean(payload.collections[collection].config.versions))
      .map((collection) => payload.db.deleteVersions({ collection, req, where: {} })),
  )

  payload.logger.info(`— Grime Time team users (dev password: changethis — rotate before production)...`)

  const GRIMETIME_TEAM = [
    { email: 'bg@grimetime.local', name: 'BG' },
    { email: 'pb@grimetime.local', name: 'PB' },
    { email: 'de@grimetime.local', name: 'DE' },
  ] as const

  for (const email of ['demo-author@example.com', 'demo-author@payloadcms.com'] as const) {
    try {
      await payload.delete({ collection: 'users', depth: 0, where: { email: { equals: email } } })
    } catch {
      /* ignore if absent */
    }
  }

  await payload.db.deleteMany({
    collection: 'users',
    req,
    where: { email: { in: [...GRIMETIME_TEAM.map((t) => t.email)] } },
  })

  const teamUsers = []
  for (const u of GRIMETIME_TEAM) {
    teamUsers.push(
      await payload.create({
        collection: 'users',
        data: { name: u.name, email: u.email, password: 'changethis' },
      }),
    )
  }
  const postAuthor = teamUsers[0]
  if (!postAuthor) throw new Error('Seed: expected Grime Time team users')

  payload.logger.info(`— Seeding media...`)

  const [image1Buffer, image2Buffer, image3Buffer, hero1Buffer] = await Promise.all([
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post1.webp',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post2.webp',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post3.webp',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-hero1.webp',
    ),
  ])

  const [image1Doc, image2Doc, image3Doc, imageHomeDoc] = await Promise.all([
    payload.create({
      collection: 'media',
      data: image1,
      file: image1Buffer,
    }),
    payload.create({
      collection: 'media',
      data: image2,
      file: image2Buffer,
    }),
    payload.create({
      collection: 'media',
      data: image2,
      file: image3Buffer,
    }),
    payload.create({
      collection: 'media',
      data: imageHero1,
      file: hero1Buffer,
    }),
  ])

  await Promise.all(
    categories.map((category) =>
      payload.create({
        collection: 'categories',
        data: {
          title: category,
          slug: category,
        },
      }),
    ),
  )

  payload.logger.info(`— Seeding posts...`)

  // Do not create posts with `Promise.all` because we want the posts to be created in order
  // This way we can sort them by `createdAt` or `publishedAt` and they will be in the expected order
  const post1Doc = await payload.create({
    collection: 'posts',
    depth: 0,
    context: {
      disableRevalidate: true,
    },
    data: post1({ heroImage: image1Doc, blockImage: image2Doc, author: postAuthor }),
  })

  const post2Doc = await payload.create({
    collection: 'posts',
    depth: 0,
    context: {
      disableRevalidate: true,
    },
    data: post2({ heroImage: image2Doc, blockImage: image3Doc, author: postAuthor }),
  })

  const post3Doc = await payload.create({
    collection: 'posts',
    depth: 0,
    context: {
      disableRevalidate: true,
    },
    data: post3({ heroImage: image3Doc, blockImage: image1Doc, author: postAuthor }),
  })

  // update each post with related posts
  await payload.update({
    id: post1Doc.id,
    collection: 'posts',
    data: {
      relatedPosts: [post2Doc.id, post3Doc.id],
    },
  })
  await payload.update({
    id: post2Doc.id,
    collection: 'posts',
    data: {
      relatedPosts: [post1Doc.id, post3Doc.id],
    },
  })
  await payload.update({
    id: post3Doc.id,
    collection: 'posts',
    data: {
      relatedPosts: [post1Doc.id, post2Doc.id],
    },
  })

  payload.logger.info(`— Seeding contact form...`)

  const contactForm = await payload.create({
    collection: 'forms',
    depth: 0,
    data: buildContactFormData(),
  })

  payload.logger.info(`— Seeding pages...`)

  const [_, contactPage] = await Promise.all([
    payload.create({
      collection: 'pages',
      depth: 0,
      data: home({ heroImage: imageHomeDoc, metaImage: image2Doc }),
    }),
    payload.create({
      collection: 'pages',
      depth: 0,
      data: contactPageData({ contactForm: contactForm }),
    }),
  ])

  payload.logger.info(`— Seeding globals...`)

  await Promise.all([
    payload.updateGlobal({
      slug: 'header',
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Home',
              url: '/',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Services',
              url: '/#services',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Pricing',
              url: '/#pricing',
            },
          },
          {
            link: {
              type: 'reference',
              label: 'Contact',
              reference: {
                relationTo: 'pages',
                value: contactPage.id,
              },
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Book online',
              url: '/schedule',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Posts',
              url: '/posts',
            },
          },
        ],
      },
    }),
    payload.updateGlobal({
      slug: 'footer',
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Admin',
              url: '/admin',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Source Code',
              newTab: true,
              url: 'https://github.com/payloadcms/payload/tree/main/templates/website',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Payload',
              newTab: true,
              url: 'https://payloadcms.com/',
            },
          },
        ],
      },
    }),
    payload.updateGlobal({
      slug: 'pricing',
      data: {
        sectionTitle: 'Packages & pricing',
        sectionIntro:
          'Starting points for typical homes — final price depends on size, soil level, and access. Request a quote for an exact number.',
        plans: [
          {
            name: 'Essential wash',
            tagline: 'Great for maintenance',
            price: 'From $149',
            priceNote: 'Typical small home / partial facade',
            highlighted: false,
            features: [
              { text: 'Soft wash siding & trim' },
              { text: 'Mildew & dust removal' },
              { text: 'Walkthrough photo summary' },
            ],
            link: {
              type: 'custom',
              label: 'Get info',
              url: '/contact',
              appearance: 'outline',
            },
          },
          {
            name: 'Full exterior',
            tagline: 'Most popular',
            price: 'From $279',
            priceNote: 'Average single-story home',
            highlighted: true,
            features: [
              { text: 'Everything in Essential' },
              { text: 'Gutters & soffits rinsed' },
              { text: 'Concrete entryway rinse' },
              { text: 'Priority scheduling window' },
            ],
            link: {
              type: 'custom',
              label: 'Book / quote',
              url: '/schedule',
              appearance: 'default',
            },
          },
          {
            name: 'Property refresh',
            tagline: 'Larger or heavily soiled',
            price: 'Custom',
            priceNote: 'Multi-story, stone, heavy organic growth',
            highlighted: false,
            features: [
              { text: 'Site visit or photo estimate' },
              { text: 'Add-ons: roof, deck, fence' },
              { text: 'Commercial & HOA welcome' },
            ],
            link: {
              type: 'custom',
              label: 'Request quote',
              url: '/contact',
              appearance: 'outline',
            },
          },
        ],
      },
    }),
  ])

  payload.logger.info('Seeded database successfully!')
}

async function fetchFileByURL(url: string): Promise<File> {
  const res = await fetch(url, {
    credentials: 'include',
    method: 'GET',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch file from ${url}, status: ${res.status}`)
  }

  const data = await res.arrayBuffer()

  return {
    name: url.split('/').pop() || `file-${Date.now()}`,
    data: Buffer.from(data),
    mimetype: `image/${url.split('.').pop()}`,
    size: data.byteLength,
  }
}
