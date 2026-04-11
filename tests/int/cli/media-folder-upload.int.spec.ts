import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { uploadMediaFolder } from '@/cli/lib/media-folder-upload'

describe('media folder upload helper', () => {
  const tempRoots: string[] = []

  afterEach(async () => {
    await Promise.all(
      tempRoots.splice(0).map(async (root) => {
        await fs.rm(root, { force: true, recursive: true }).catch(() => {})
      }),
    )
  })

  it('uploads images, ignores non-images, and reports duplicate skips by filename', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'grimetime-media-upload-'))
    tempRoots.push(root)
    await fs.writeFile(path.join(root, 'front-gate.jpg'), Buffer.from('jpg'))
    await fs.writeFile(path.join(root, 'notes.txt'), 'ignore')
    await fs.mkdir(path.join(root, 'nested'))
    await fs.writeFile(path.join(root, 'nested', 'driveway.png'), Buffer.from('png'))

    const payload = {
      create: vi.fn().mockResolvedValueOnce({ id: 101 }).mockResolvedValueOnce({ id: 102 }),
      find: vi
        .fn()
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [{ id: 77 }] }),
      update: vi.fn(),
    }

    const summary = await uploadMediaFolder({
      directory: root,
      payload: payload as never,
      recursive: true,
      replaceExisting: false,
      req: {} as never,
    })

    expect(summary).toMatchObject({
      createdCount: 1,
      failedCount: 0,
      replacedCount: 0,
      scannedCount: 2,
      skippedCount: 1,
    })
    expect(summary.results).toEqual([
      {
        action: 'created',
        filename: 'front-gate.jpg',
        mediaId: 101,
        relativePath: 'front-gate.jpg',
      },
      {
        action: 'skipped',
        error: 'Existing media with the same filename already exists.',
        filename: 'driveway.png',
        relativePath: path.join('nested', 'driveway.png'),
      },
    ])
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('replaces existing media when requested and surfaces upload failures', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'grimetime-media-upload-'))
    tempRoots.push(root)
    await fs.writeFile(path.join(root, 'crew.webp'), Buffer.from('webp'))
    await fs.writeFile(path.join(root, 'boom.gif'), Buffer.from('gif'))

    const payload = {
      create: vi.fn().mockRejectedValue(new Error('disk full')),
      find: vi.fn().mockResolvedValueOnce({ docs: [{ id: 88 }] }).mockResolvedValueOnce({ docs: [] }),
      update: vi.fn().mockResolvedValue({ id: 88 }),
    }

    const summary = await uploadMediaFolder({
      altPrefix: 'Job photo',
      directory: root,
      payload: payload as never,
      replaceExisting: true,
      req: {} as never,
    })

    expect(summary).toMatchObject({
      createdCount: 0,
      failedCount: 1,
      replacedCount: 1,
      scannedCount: 2,
      skippedCount: 0,
    })
    expect(summary.results[0]).toEqual({
      action: 'replaced',
      filename: 'boom.gif',
      mediaId: 88,
      relativePath: 'boom.gif',
    })
    expect(summary.results[1]).toEqual({
      action: 'failed',
      error: 'disk full',
      filename: 'crew.webp',
      relativePath: 'crew.webp',
    })
  })
})
