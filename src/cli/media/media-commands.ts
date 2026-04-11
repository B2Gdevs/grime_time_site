import path from 'node:path'

import boxen from 'boxen'
import { defineCommand, renderUsage } from 'citty'
import type { ArgsDef, CommandDef } from 'citty'
import pc from 'picocolors'

import { formatTable } from '../lib/format-table'
import { resolveRepoRoot } from '../lib/repo-root'
import { withPayloadAdmin } from '../lib/payload-admin-session'
import { DEFAULT_MEDIA_DROP_DIRECTORY_RELATIVE, uploadMediaFolder } from '../lib/media-folder-upload'

const uploadFolderArgs = {
  directory: {
    type: 'positional',
    required: false,
    description: `Local folder containing images to upload into Payload media. Defaults to ${DEFAULT_MEDIA_DROP_DIRECTORY_RELATIVE}.`,
  },
  recursive: {
    type: 'boolean',
    alias: 'r',
    description: 'Walk subfolders recursively.',
  },
  replace: {
    type: 'boolean',
    description: 'Replace existing media documents that already use the same filename.',
  },
  dryRun: {
    type: 'boolean',
    alias: 'n',
    description: 'Scan and report what would happen without uploading files.',
  },
  payloadFolderId: {
    type: 'string',
    description: 'Optional Payload media folder id to assign to each uploaded asset.',
  },
  altPrefix: {
    type: 'string',
    description: 'Optional prefix added to generated alt text for every file.',
  },
} satisfies ArgsDef

const uploadFolderCommand = defineCommand({
  meta: {
    name: 'upload-folder',
    description: 'Upload a local folder of image files into the Payload media library.',
  },
  args: uploadFolderArgs,
  async run({ args }) {
    const repoRoot = resolveRepoRoot()
    const directory =
      String(args.directory || '').trim() || DEFAULT_MEDIA_DROP_DIRECTORY_RELATIVE
    const usingDefaultDirectory = directory === DEFAULT_MEDIA_DROP_DIRECTORY_RELATIVE

    const payloadFolderIdRaw = String(args.payloadFolderId || '').trim()
    const payloadFolderId =
      payloadFolderIdRaw.length > 0 && !Number.isNaN(Number(payloadFolderIdRaw))
        ? Number(payloadFolderIdRaw)
        : undefined

    if (payloadFolderIdRaw.length > 0 && typeof payloadFolderId !== 'number') {
      console.error(pc.red(`Invalid --payloadFolderId value: ${payloadFolderIdRaw}`))
      process.exit(1)
    }

    const result = await withPayloadAdmin((session) =>
      uploadMediaFolder({
        altPrefix: String(args.altPrefix || ''),
        createIfMissing: usingDefaultDirectory,
        directory: usingDefaultDirectory
          ? path.join(repoRoot, DEFAULT_MEDIA_DROP_DIRECTORY_RELATIVE)
          : directory,
        dryRun: Boolean(args.dryRun),
        payload: session.payload,
        payloadFolderId,
        recursive: Boolean(args.recursive),
        replaceExisting: Boolean(args.replace),
        req: session.req,
      }),
    )

    if (!result.ok) {
      console.error(pc.red(result.message))
      process.exit(result.code)
    }

    const summary = result.value
    const rows = summary.results.map((item) => [
      item.action,
      item.relativePath,
      'mediaId' in item ? String(item.mediaId) : '—',
      'error' in item ? (item.error ?? '—') : '—',
    ])

    console.log(
      boxen(
        [
          `${pc.cyan('Folder')}:   ${summary.folderPath}`,
          `${pc.cyan('Scanned')}:  ${summary.scannedCount}`,
          `${pc.green('Created')}: ${summary.createdCount}`,
          `${pc.yellow('Replaced')}: ${summary.replacedCount}`,
          `${pc.yellow('Skipped')}: ${summary.skippedCount}`,
          `${pc.red('Failed')}:  ${summary.failedCount}`,
          '',
          pc.bold('Results'),
          rows.length > 0
            ? formatTable(['action', 'file', 'mediaId', 'error'], rows)
            : pc.dim('(no matching image files found)'),
        ].join('\n'),
        {
          borderColor: summary.failedCount > 0 ? 'yellow' : 'green',
          borderStyle: 'round',
          padding: 1,
          title: args.dryRun ? 'grimetime media upload-folder (dry run)' : 'grimetime media upload-folder',
        },
      ),
    )

    if (summary.failedCount > 0) {
      process.exit(1)
    }
  },
})

let mediaRootRef: CommandDef

mediaRootRef = defineCommand({
  meta: {
    name: 'media',
    description: 'Media library import and maintenance commands.',
  },
  subCommands: {
    'upload-folder': uploadFolderCommand,
  },
})

export const mediaRootCommand = mediaRootRef

export async function printMediaQuickHelp(parent?: CommandDef): Promise<void> {
  console.log(
    boxen(
      [
        pc.bold('grimetime media') + pc.dim(' — Payload media library utilities'),
        '',
        `${pc.cyan('upload-folder')}  Import image files from a local folder`,
        pc.dim(`Defaults to ${DEFAULT_MEDIA_DROP_DIRECTORY_RELATIVE} when no path is provided.`),
      ].join('\n'),
      { title: 'media', padding: 1, borderStyle: 'round', borderColor: 'magenta' },
    ),
  )
  console.log((await renderUsage(mediaRootCommand, parent)) + '\n')
}
