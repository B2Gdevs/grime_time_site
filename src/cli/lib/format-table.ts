/** Simple fixed-width columns for terminal tables (no unicode table chars). */
export function formatTable(headers: string[], rows: string[][]): string {
  const cols = headers.length
  const widths = headers.map((h, i) => {
    const cellWidths = [h.length, ...rows.map((r) => (r[i] ?? '').length)]
    return Math.max(...cellWidths, 3)
  })

  const pad = (s: string, w: number) => (s.length >= w ? s.slice(0, w) : s + ' '.repeat(w - s.length))

  const line = (cells: string[]) =>
    cells.map((c, i) => pad(c, widths[i])).join('  ').trimEnd()

  const out: string[] = [line(headers), line(widths.map((w) => '─'.repeat(w)))]
  for (const row of rows) {
    const cells = headers.map((_, i) => row[i] ?? '')
    out.push(line(cells))
  }
  return out.join('\n')
}
