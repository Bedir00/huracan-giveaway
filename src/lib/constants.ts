/**
 * Domain vocabulary. Everything the UI labels lives here so the pipeline,
 * sources or potential list can grow without a database migration.
 */

export const ROLES = ['ADMIN', 'AGENT'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  AGENT: 'Akquise-Mitarbeiter',
}

/** Pipeline order matters: it drives the board, the funnel and progress. */
export const STAGES = [
  'NEU',
  'RECHERCHE',
  'KONTAKTIERT',
  'ANTWORT',
  'INTERESSIERT',
  'TERMIN',
  'ANGEBOT',
  'GEWONNEN',
  'VERLOREN',
] as const
export type Stage = (typeof STAGES)[number]

/** The stages shown as Kanban columns - "Verloren" is an exit, not a column. */
export const BOARD_STAGES = STAGES.filter((s) => s !== 'VERLOREN') as readonly Stage[]

/** Stages that count as "still in play". */
export const ACTIVE_STAGES = STAGES.filter(
  (s) => s !== 'GEWONNEN' && s !== 'VERLOREN',
) as readonly Stage[]

export const STAGE_LABELS: Record<Stage, string> = {
  NEU: 'Neu',
  RECHERCHE: 'Recherche',
  KONTAKTIERT: 'Kontakt aufgenommen',
  ANTWORT: 'Antwort erhalten',
  INTERESSIERT: 'Interessiert',
  TERMIN: 'Termin vereinbart',
  ANGEBOT: 'Angebot',
  GEWONNEN: 'Gewonnen',
  VERLOREN: 'Verloren / Kein Interesse',
}

/** Short labels for the Kanban header and mobile chips. */
export const STAGE_SHORT: Record<Stage, string> = {
  NEU: 'Neu',
  RECHERCHE: 'Recherche',
  KONTAKTIERT: 'Kontaktiert',
  ANTWORT: 'Antwort',
  INTERESSIERT: 'Interessiert',
  TERMIN: 'Termin',
  ANGEBOT: 'Angebot',
  GEWONNEN: 'Gewonnen',
  VERLOREN: 'Verloren',
}

export const PRIORITIES = ['HOT', 'WARM', 'COLD'] as const
export type Priority = (typeof PRIORITIES)[number]

export const PRIORITY_LABELS: Record<Priority, string> = {
  HOT: 'Hot',
  WARM: 'Warm',
  COLD: 'Cold',
}

export const SOURCES = [
  'GOOGLE_MAPS',
  'INSTAGRAM',
  'LINKEDIN',
  'EMPFEHLUNG',
  'TELEFONAKQUISE',
  'EIGENRECHERCHE',
  'SONSTIGE',
] as const
export type Source = (typeof SOURCES)[number]

export const SOURCE_LABELS: Record<Source, string> = {
  GOOGLE_MAPS: 'Google Maps',
  INSTAGRAM: 'Instagram',
  LINKEDIN: 'LinkedIn',
  EMPFEHLUNG: 'Empfehlung',
  TELEFONAKQUISE: 'Telefonakquise',
  EIGENRECHERCHE: 'Eigenrecherche',
  SONSTIGE: 'Sonstige',
}

/**
 * Recognised sales angles. `approach` is the suggested pitch, which powers the
 * "Akquise-Ansatz" hint on the lead page and can later feed AI messaging.
 */
export const POTENTIALS = [
  {
    key: 'NO_WEBSITE',
    label: 'Keine Website',
    approach: 'Website-Erstaufbau anbieten - Sichtbarkeit von null auf professionell.',
  },
  {
    key: 'OUTDATED_WEBSITE',
    label: 'Veraltete Website',
    approach: 'Relaunch pitchen - Vorher/Nachher-Vergleich mit Wettbewerbern zeigen.',
  },
  {
    key: 'BAD_MOBILE',
    label: 'Schlechte mobile Darstellung',
    approach: 'Mobile-Check per Screenshot senden - der schnellste Aha-Moment.',
  },
  {
    key: 'NO_SHOP',
    label: 'Kein Onlineshop',
    approach: 'Zweiten Umsatzkanal aufzeigen - Shop als Ergänzung zum Ladengeschäft.',
  },
  {
    key: 'BAD_SHOP',
    label: 'Schlechter Onlineshop',
    approach: 'Shop-Audit anbieten - Fokus auf Warenkorbabbrüche.',
  },
  {
    key: 'WEAK_CONVERSION',
    label: 'Schwache Conversion-Struktur',
    approach: 'Conversion-Analyse anbieten - klare Call-to-Actions und Struktur.',
  },
  {
    key: 'NO_META_ADS',
    label: 'Keine Meta Ads',
    approach: 'Testkampagne vorschlagen - kleines Budget, messbares Ergebnis.',
  },
  {
    key: 'NO_GOOGLE_ADS',
    label: 'Keine Google Ads',
    approach: 'Suchvolumen der Branche zeigen - verlorene Nachfrage sichtbar machen.',
  },
  {
    key: 'WEAK_SOCIAL',
    label: 'Schwache Social-Media-Präsenz',
    approach: 'Content-Paket anbieten - Wiedererkennbarkeit und Frequenz.',
  },
  {
    key: 'BAD_PRODUCT_PRESENTATION',
    label: 'Schlechte Produktdarstellung',
    approach: 'Bild- und Textoptimierung anbieten - Produkte verkaufen sich über Darstellung.',
  },
  {
    key: 'NO_TRACKING',
    label: 'Fehlendes Tracking',
    approach: 'Tracking-Setup anbieten - ohne Daten kein Optimieren.',
  },
  { key: 'OTHER', label: 'Sonstiges', approach: 'Individuellen Ansatz in den Notizen festhalten.' },
] as const

export type PotentialKey = (typeof POTENTIALS)[number]['key']

export const POTENTIAL_LABELS: Record<string, string> = Object.fromEntries(
  POTENTIALS.map((p) => [p.key, p.label]),
)

export const POTENTIAL_APPROACHES: Record<string, string> = Object.fromEntries(
  POTENTIALS.map((p) => [p.key, p.approach]),
)

export const ACTIVITY_TYPES = [
  'CALL',
  'WHATSAPP',
  'EMAIL',
  'INSTAGRAM',
  'LINKEDIN',
  'MEETING',
  'NOTE',
  'FOLLOWUP',
  'OFFER',
  'STAGE',
  'SYSTEM',
] as const
export type ActivityType = (typeof ACTIVITY_TYPES)[number]

/** Types an employee can log by hand; STAGE/SYSTEM are written by the app. */
export const LOGGABLE_ACTIVITY_TYPES = ACTIVITY_TYPES.filter(
  (t) => t !== 'STAGE' && t !== 'SYSTEM',
) as readonly ActivityType[]

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  CALL: 'Anruf',
  WHATSAPP: 'WhatsApp',
  EMAIL: 'E-Mail',
  INSTAGRAM: 'Instagram',
  LINKEDIN: 'LinkedIn',
  MEETING: 'Meeting',
  NOTE: 'Notiz',
  FOLLOWUP: 'Follow-up',
  OFFER: 'Angebot',
  STAGE: 'Statuswechsel',
  SYSTEM: 'System',
}

export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  CALL: '📞',
  WHATSAPP: '💬',
  EMAIL: '✉️',
  INSTAGRAM: '📷',
  LINKEDIN: '💼',
  MEETING: '🤝',
  NOTE: '📝',
  FOLLOWUP: '🔁',
  OFFER: '📄',
  STAGE: '➡️',
  SYSTEM: '⚙️',
}

export const OUTCOMES = ['REACHED', 'NOT_REACHED', 'REPLIED', 'NO_REPLY'] as const
export type Outcome = (typeof OUTCOMES)[number]

export const OUTCOME_LABELS: Record<Outcome, string> = {
  REACHED: 'erreicht',
  NOT_REACHED: 'nicht erreicht',
  REPLIED: 'hat geantwortet',
  NO_REPLY: 'keine Antwort',
}

export const CHANNELS = ['PHONE', 'WHATSAPP', 'EMAIL', 'INSTAGRAM', 'LINKEDIN'] as const
export type Channel = (typeof CHANNELS)[number]

export const CHANNEL_LABELS: Record<Channel, string> = {
  PHONE: 'Telefon',
  WHATSAPP: 'WhatsApp',
  EMAIL: 'E-Mail',
  INSTAGRAM: 'Instagram',
  LINKEDIN: 'LinkedIn',
}

export const APPOINTMENT_KINDS = ['CALL', 'VIDEO', 'ONSITE', 'OTHER'] as const
export type AppointmentKind = (typeof APPOINTMENT_KINDS)[number]

export const APPOINTMENT_KIND_LABELS: Record<AppointmentKind, string> = {
  CALL: 'Telefontermin',
  VIDEO: 'Videocall',
  ONSITE: 'Vor Ort',
  OTHER: 'Sonstiges',
}

export const APPOINTMENT_RESULTS = ['OPEN', 'HELD', 'NO_SHOW', 'POSTPONED', 'WON', 'LOST'] as const
export type AppointmentResult = (typeof APPOINTMENT_RESULTS)[number]

export const APPOINTMENT_RESULT_LABELS: Record<AppointmentResult, string> = {
  OPEN: 'Offen',
  HELD: 'Stattgefunden',
  NO_SHOW: 'Nicht erschienen',
  POSTPONED: 'Verschoben',
  WON: 'Gewonnen',
  LOST: 'Verloren',
}

export const TEMPLATE_CATEGORIES = [
  'PHONE',
  'WHATSAPP',
  'INSTAGRAM',
  'LINKEDIN',
  'EMAIL',
  'FOLLOWUP',
  'OTHER',
] as const
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number]

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  PHONE: 'Telefon-Skript',
  WHATSAPP: 'WhatsApp-Vorlage',
  INSTAGRAM: 'Instagram-DM',
  LINKEDIN: 'LinkedIn-Nachricht',
  EMAIL: 'E-Mail',
  FOLLOWUP: 'Follow-up Nachricht',
  OTHER: 'Sonstiges',
}

export const COMPANY_SIZES = ['1-5', '6-20', '21-50', '51-200', '200+'] as const

/** Suggested next steps offered as one-tap chips when setting a follow-up. */
export const FOLLOWUP_SUGGESTIONS = [
  'Erneut anrufen',
  'WhatsApp senden',
  'Angebot nachfassen',
  'Websiteanalyse erstellen',
  'Termin vereinbaren',
  'E-Mail nachfassen',
] as const

export function labelOf(map: Record<string, string>, value: string | null | undefined): string {
  if (!value) return '-'
  return map[value] ?? value
}
