import {
  POTENTIALS,
  PRIORITIES,
  PRIORITY_LABELS,
  SOURCE_LABELS,
  SOURCES,
  STAGE_LABELS,
  STAGE_SHORT,
  STAGES,
} from './constants'

/** Accepted header spellings per field - German first, English as a fallback. */
const COLUMN_ALIASES: Record<string, string[]> = {
  company: ['firma', 'firmenname', 'unternehmen', 'company', 'name'],
  industry: ['branche', 'industry'],
  location: ['standort', 'ort', 'stadt', 'location', 'city'],
  website: ['website', 'webseite', 'url', 'domain'],
  instagram: ['instagram', 'insta'],
  linkedin: ['linkedin'],
  phone: ['telefon', 'telefonnummer', 'tel', 'phone', 'mobil'],
  email: ['email', 'e-mail', 'mail'],
  companySize: [
    'unternehmensgroesse',
    'unternehmensgröße',
    'groesse',
    'größe',
    'mitarbeiter',
    'size',
  ],
  source: ['quelle', 'lead-quelle', 'source'],
  stage: ['status', 'stufe', 'phase', 'stage'],
  priority: ['prio', 'priorität', 'prioritaet', 'priority'],
  potentials: ['potenzial', 'potenziale', 'potential', 'potentials'],
  notes: ['notiz', 'notizen', 'anmerkung', 'notes'],
  contactName: ['ansprechpartner', 'kontakt', 'contact', 'contactname'],
  contactPosition: ['position', 'funktion', 'rolle'],
  contactPhone: ['ansprechpartner telefon', 'kontakt telefon', 'contactphone'],
  contactEmail: ['ansprechpartner email', 'kontakt email', 'contactemail'],
  dealValue: ['umsatz', 'auftragswert', 'wert', 'dealvalue', 'value'],
}

/** Picks a value from a CSV row by trying every known alias for the field. */
export function pick(row: Record<string, string>, field: string): string | null {
  for (const alias of COLUMN_ALIASES[field] ?? []) {
    const value = row[alias]
    if (value !== undefined && value.trim() !== '') return value.trim()
  }
  return null
}

function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '')
}

/** Resolves a cell to an internal key, accepting the key or the German label. */
function resolve<T extends string>(
  value: string | null,
  keys: readonly T[],
  labels: Record<string, string>[],
  fallback: T,
): T {
  if (!value) return fallback
  const needle = normalise(value)
  for (const key of keys) {
    if (normalise(key) === needle) return key
    for (const map of labels) {
      const label = map[key]
      if (label && normalise(label) === needle) return key
    }
  }
  return fallback
}

export function resolveSource(value: string | null) {
  return resolve(value, SOURCES, [SOURCE_LABELS], 'SONSTIGE')
}

export function resolveStage(value: string | null) {
  return resolve(value, STAGES, [STAGE_LABELS, STAGE_SHORT], 'NEU')
}

export function resolvePriority(value: string | null) {
  return resolve(value, PRIORITIES, [PRIORITY_LABELS], 'WARM')
}

/** Reads a comma/pipe separated potentials cell into known potential keys. */
export function resolvePotentials(value: string | null): string[] {
  if (!value) return []
  const parts = value
    .split(/[,;|]/)
    .map((p) => normalise(p))
    .filter(Boolean)
  return POTENTIALS.filter(
    (p) => parts.includes(normalise(p.key)) || parts.includes(normalise(p.label)),
  ).map((p) => p.key)
}

export function parseAmount(value: string | null): number | null {
  if (!value) return null
  const cleaned = value
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}\b)/g, '')
    .replace(',', '.')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

/** Header row of the CSV export, and the template offered for imports. */
export const EXPORT_HEADERS = [
  'Firma',
  'Branche',
  'Standort',
  'Website',
  'Instagram',
  'LinkedIn',
  'Telefon',
  'E-Mail',
  'Unternehmensgröße',
  'Quelle',
  'Status',
  'Priorität',
  'Potenziale',
  'Ansprechpartner',
  'Position',
  'Ansprechpartner Telefon',
  'Ansprechpartner E-Mail',
  'Zuständig',
  'Gefunden von',
  'Termin von',
  'Abschluss von',
  'Umsatz',
  'Nächste Aufgabe',
  'Nächste Aufgabe fällig',
  'Letzter Kontakt',
  'Gewonnen am',
  'Verloren am',
  'Verlustgrund',
  'Notizen',
  'Angelegt am',
]
