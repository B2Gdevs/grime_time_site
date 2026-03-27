/**
 * Generate AI marketing images (OpenAI) and upsert into Payload `media` by stable seed filenames.
 * Prompts and wiring are defined in `src/lib/media/image-generation-manifest.ts`.
 *
 * Requires: PROVIDERS__OPENAI__API_KEY or OPENAI_API_KEY, admin credentials (same as npm run seed).
 * Optional: OPENAI_IMAGE_MODEL (default gpt-image-1)
 *
 * Usage:
 *   npm run generate:marketing-images
 *   npm run generate:marketing-images -- --include-posts
 *   npm run generate:marketing-images -- --list
 *   npm run generate:marketing-images -- --status
 *   npm run generate:marketing-images -- --library
 *   npm run generate:marketing-images -- --with-library
 *   npm run generate:marketing-images -- --everything
 *   npm run generate:marketing-images -- --overwrite-existing
 */
import 'dotenv/config'

import type { File } from 'payload'
import { createLocalReq, getPayload } from 'payload'
import sharp from 'sharp'

import { USERS_COLLECTION_SLUG } from '../src/collections/Users'
import { upsertMediaByFilename } from '../src/endpoints/seed/upsert'
import {
  buildPromptForEntry,
  entriesForBatches,
  getSeedDataForEntry,
  GLOBAL_IMAGE_STYLE,
  IMAGE_GENERATION_ENTRIES,
  type ImageGenBatch,
} from '../src/lib/media/image-generation-manifest'
import { isAdminUser } from '../src/lib/auth/roles'
import { generateOpenAIImage } from '../src/lib/media/openaiImageGeneration'
import type { User } from '../src/payload-types'
import config from '../src/payload.config'

function resolveSeedCredentials():
  | { email: string; password: string }
  | null {
  const seedEmail = process.env.SEED_LOGIN_EMAIL?.trim().toLowerCase()
  const seedPassword = process.env.SEED_LOGIN_PASSWORD?.trim()
  if (seedEmail && seedPassword) {
    return { email: seedEmail, password: seedPassword }
  }
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const adminPassword = process.env.ADMIN_PASSWORD?.trim()
  if (adminEmail && adminPassword) {
    return { email: adminEmail, password: adminPassword }
  }
  return null
}

const MODEL = process.env.OPENAI_IMAGE_MODEL?.trim() || 'gpt-image-1'

function parseBatches(argv: string[]): ImageGenBatch[] {
  if (argv.includes('--everything') || argv.includes('--batch=all')) {
    return ['core', 'posts', 'extended']
  }
  if (argv.includes('--library') || argv.includes('--extended') || argv.includes('--batch=extended')) {
    return ['extended']
  }
  const batches: ImageGenBatch[] = ['core']
  if (argv.includes('--include-posts') || argv.includes('--batch=posts')) {
    batches.push('posts')
  }
  if (argv.includes('--with-library')) {
    batches.push('extended')
  }
  return batches
}

function printList(): void {
  console.log('Image generation manifest (see src/lib/media/image-generation-manifest.ts)\n')
  console.log('Global style:', GLOBAL_IMAGE_STYLE.photoPrefix)
  console.log('Brand / negatives:', GLOBAL_IMAGE_STYLE.brandContext, '\n')
  for (const e of IMAGE_GENERATION_ENTRIES) {
    const flag = e.enabled ? 'on' : 'off'
    const wired = e.wiredTo.join(', ')
    console.log(`[${e.batch}] ${e.id}  (${flag})  ${e.filename}`)
    console.log(`    category: ${e.category}  →  ${wired}`)
    if (e.notes) console.log(`    notes: ${e.notes}`)
    console.log('')
  }
  const planned = IMAGE_GENERATION_ENTRIES.filter((x) => !x.enabled).length
  const active = IMAGE_GENERATION_ENTRIES.filter((x) => x.enabled).length
  console.log(`Summary: ${active} enabled for generation, ${planned} disabled (backlog).`)
}

async function getMediaByFilename(
  payload: Awaited<ReturnType<typeof getPayload>>,
  filename: string,
): Promise<{ id: string | number; url: string | null; filename: string | null } | null> {
  const found = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: { filename: { equals: filename } },
  })
  const doc = found.docs[0]
  if (!doc) return null
  return {
    id: doc.id,
    url: typeof doc.url === 'string' ? doc.url : null,
    filename: typeof doc.filename === 'string' ? doc.filename : null,
  }
}

async function pngToOutput(
  png: Buffer,
  filename: string,
): Promise<{ buffer: Buffer; mimetype: string }> {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'png') {
    const buffer = await sharp(png).png({ compressionLevel: 9 }).toBuffer()
    return { buffer, mimetype: 'image/png' }
  }
  if (ext === 'jpg' || ext === 'jpeg') {
    const buffer = await sharp(png).jpeg({ mozjpeg: true, quality: 88 }).toBuffer()
    return { buffer, mimetype: 'image/jpeg' }
  }
  if (ext === 'webp') {
    const buffer = await sharp(png).webp({ quality: 88 }).toBuffer()
    return { buffer, mimetype: 'image/webp' }
  }
  const buffer = await sharp(png).jpeg({ mozjpeg: true, quality: 88 }).toBuffer()
  return { buffer, mimetype: 'image/jpeg' }
}

async function run(): Promise<number> {
  const argv = process.argv.slice(2)
  const overwriteExisting = argv.includes('--overwrite-existing') || argv.includes('--force')

  if (argv.includes('--list') || argv.includes('-l')) {
    printList()
    return 0
  }

  const creds = resolveSeedCredentials()
  if (!creds) {
    console.error(
      'Set SEED_LOGIN_EMAIL + SEED_LOGIN_PASSWORD or ADMIN_EMAIL + ADMIN_PASSWORD (same as npm run seed).',
    )
    return 1
  }

  const batches = parseBatches(argv)
  const jobs = entriesForBatches(batches)

  if (jobs.length === 0) {
    console.error('No jobs for batches:', batches.join(', '), '(check enabled flags in manifest)')
    return 1
  }

  const payload = await getPayload({ config })

  let resolvedUser: User | null = null
  try {
    const loginResult = await payload.login({
      collection: USERS_COLLECTION_SLUG,
      data: { email: creds.email, password: creds.password },
    })
    resolvedUser = (loginResult.user as User | null) ?? null
  } catch {
    const matchedUsers = await payload.find({
      collection: USERS_COLLECTION_SLUG,
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: { email: { equals: creds.email } },
    })
    resolvedUser = (matchedUsers.docs[0] as User | undefined) ?? null
  }

  if (!resolvedUser || !isAdminUser(resolvedUser)) {
    console.error('Could not resolve an admin user for media upload.')
    return 1
  }

  if (argv.includes('--status')) {
    console.log(`Media status for batches: ${batches.join(', ')}\n`)
    for (const job of jobs) {
      const existing = await getMediaByFilename(payload, job.filename)
      if (!existing) {
        console.log(`[missing] ${job.filename}`)
      } else {
        console.log(`[present] ${job.filename} -> ${existing.url ?? '(no url)'} (id=${existing.id})`)
      }
    }
    try {
      await payload.destroy()
    } catch {
      /* ignore */
    }
    return 0
  }

  const req = await createLocalReq({ user: resolvedUser }, payload)

  console.log(
    `Batches: ${batches.join(', ')} — ${jobs.length} image(s) with ${MODEL} (${overwriteExisting ? 'overwrite' : 'skip-existing'})…`,
  )

  let createdCount = 0
  let updatedCount = 0
  let skippedCount = 0
  for (let i = 0; i < jobs.length; i += 1) {
    const job = jobs[i]
    const prompt = buildPromptForEntry(job)
    const size = job.size?.trim() || '1024x1024'

    process.stdout.write(`  [${i + 1}/${jobs.length}] ${job.filename}… `)
    const existingBefore = await getMediaByFilename(payload, job.filename)
    if (existingBefore && !overwriteExisting) {
      skippedCount += 1
      console.log(`skip (already exists) ${existingBefore.url ?? ''}`.trim())
      continue
    }

    const { buffer: pngBuf } = await generateOpenAIImage({
      model: MODEL,
      output_format: 'png',
      prompt,
      quality: 'high',
      size,
    })

    const { buffer: fileBuffer, mimetype } = await pngToOutput(pngBuf, job.filename)

    const file: File = {
      data: fileBuffer,
      mimetype,
      name: job.filename,
      size: fileBuffer.byteLength,
    }

    await upsertMediaByFilename(payload, req, {
      data: getSeedDataForEntry(job),
      filename: job.filename,
      file,
    })
    if (existingBefore) {
      updatedCount += 1
    } else {
      createdCount += 1
    }

    const existingAfter = await getMediaByFilename(payload, job.filename)
    console.log(`ok ${existingAfter?.url ?? ''}`.trim())
  }

  console.log(
    `Done. created=${createdCount}, updated=${updatedCount}, skipped=${skippedCount}. Existing page relationships keep the same IDs.`,
  )
  if (!batches.includes('posts') && batches.includes('core')) {
    console.log('Tip: blog headers: add --include-posts')
  }
  if (!batches.includes('extended')) {
    console.log('Tip: textures / services / commercial library: npm run generate:marketing-images -- --library')
  }

  try {
    await payload.destroy()
  } catch {
    /* ignore */
  }

  return 0
}

void run()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
