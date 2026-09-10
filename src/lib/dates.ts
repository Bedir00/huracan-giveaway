/**
 * Date helpers. All boundaries are computed in the server's local timezone,
 * which is what a single-team tool wants: "heute" means the team's today.
 * Set TZ=Europe/Berlin on the host to pin it.
 */

export function startOfDay(d: Date = new Date()): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function endOfDay(d: Date = new Date()): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}

export function startOfWeek(d: Date = new Date()): Date {
  const x = startOfDay(d)
  const day = (x.getDay() + 6) % 7 // Monday = 0
  return addDays(x, -day)
}

export function startOfMonth(d: Date = new Date()): Date {
  const x = startOfDay(d)
  x.setDate(1)
  return x
}

export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

const DATE_FMT = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})
const TIME_FMT = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' })
const WEEKDAY_FMT = new Intl.DateTimeFormat('de-DE', { weekday: 'short' })

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '-'
  return DATE_FMT.format(new Date(d))
}

export function fmtTime(d: Date | string | null | undefined): string {
  if (!d) return '-'
  return TIME_FMT.format(new Date(d))
}

export function fmtDateTime(d: Date | string | null | undefined): string {
  if (!d) return '-'
  const date = new Date(d)
  return `${DATE_FMT.format(date)}, ${TIME_FMT.format(date)}`
}

export function fmtWeekday(d: Date | string): string {
  return WEEKDAY_FMT.format(new Date(d))
}

/** "heute", "morgen", "vor 3 Tagen" - short, human, calendar-day based. */
export function fmtRelativeDay(d: Date | string): string {
  const target = startOfDay(new Date(d)).getTime()
  const today = startOfDay().getTime()
  const diff = Math.round((target - today) / 86_400_000)
  if (diff === 0) return 'heute'
  if (diff === 1) return 'morgen'
  if (diff === -1) return 'gestern'
  if (diff > 1) return `in ${diff} Tagen`
  return `vor ${Math.abs(diff)} Tagen`
}

/** Value for an <input type="date"> / "datetime-local" field. */
export function toDateInput(d: Date | string | null | undefined): string {
  if (!d) return ''
  const date = new Date(d)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function toTimeInput(d: Date | string | null | undefined): string {
  if (!d) return ''
  const date = new Date(d)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * Combines a `date` input with an optional `time` input into a Date.
 * Without a time the due date lands at end of day, so an all-day follow-up is
 * not counted as overdue at 00:01.
 */
export function parseDateTimeInput(
  date: string | null | undefined,
  time?: string | null,
): { at: Date; hasTime: boolean } | null {
  if (!date) return null
  const [y, m, d] = date.split('-').map(Number)
  if (!y || !m || !d) return null
  if (time) {
    const [hh, mm] = time.split(':').map(Number)
    if (!Number.isNaN(hh) && !Number.isNaN(mm)) {
      return { at: new Date(y, m - 1, d, hh, mm, 0, 0), hasTime: true }
    }
  }
  return { at: new Date(y, m - 1, d, 23, 59, 0, 0), hasTime: false }
}
