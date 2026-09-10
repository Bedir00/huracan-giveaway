/**
 * Minimal RFC-4180 CSV reader/writer. Hand-rolled to keep the dependency
 * surface small; handles quotes, embedded separators, newlines and BOM, and
 * auto-detects comma vs. semicolon (German Excel exports).
 */

export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, '')
  const delimiter = detectDelimiter(text)
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]!

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === delimiter) {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }

  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}

function detectDelimiter(text: string): string {
  const head = text.split(/\r?\n/, 1)[0] ?? ''
  const semicolons = (head.match(/;/g) ?? []).length
  const commas = (head.match(/,/g) ?? []).length
  return semicolons > commas ? ';' : ','
}

/** Parses into objects keyed by (trimmed, lowercased) header name. */
export function parseCsvObjects(input: string): Record<string, string>[] {
  const rows = parseCsv(input)
  if (!rows.length) return []
  const headers = rows[0]!.map((h) => h.trim().toLowerCase())
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {}
    headers.forEach((header, index) => {
      obj[header] = (row[index] ?? '').trim()
    })
    return obj
  })
}

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/**
 * Serialises with `;` and a BOM so Excel in a German locale opens the file
 * with correct columns and umlauts on a double-click.
 */
export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(escapeCell).join(';')]
  for (const row of rows) lines.push(row.map(escapeCell).join(';'))
  return `﻿${lines.join('\r\n')}\r\n`
}
