import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/docs/catalog', () => ({
  getPortalDocs: vi.fn(() => [
    {
      audience: 'admin',
      filePath: '.planning/workflows/example.md',
      group: 'Team playbooks',
      slug: 'example',
      title: 'Example playbook',
    },
  ]),
  readPortalDoc: vi.fn(async () => `# Intake\n\nCall the lead fast.\n\n## Follow-up\n\nSend the quote the same day when possible.`),
}))

describe('approved AI docs', () => {
  it('chunks approved internal docs by heading and normalizes markdown', async () => {
    const { loadApprovedOpsDocChunks } = await import('@/lib/ai/approved-docs')

    const chunks = await loadApprovedOpsDocChunks()

    expect(chunks.length).toBeGreaterThanOrEqual(2)
    expect(chunks[0]?.title).toBe('Example playbook')
    expect(chunks[0]?.heading).toBe('Intake')
    expect(chunks.some((chunk) => chunk.heading === 'Follow-up')).toBe(true)
    expect(chunks.every((chunk) => chunk.sourceChecksum.length === 64)).toBe(true)
  })
})
