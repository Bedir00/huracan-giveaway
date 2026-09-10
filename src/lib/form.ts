/** Small helpers for reading FormData in server actions. */

export function str(fd: FormData, key: string): string | null {
  const value = fd.get(key)
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export function req(fd: FormData, key: string, label: string): string {
  const value = str(fd, key)
  if (!value) throw new ValidationError(`${label} ist ein Pflichtfeld.`)
  return value
}

export function num(fd: FormData, key: string): number | null {
  const value = str(fd, key)
  if (value === null) return null
  const parsed = Number(value.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

export function int(fd: FormData, key: string, fallback: number): number {
  const value = num(fd, key)
  return value === null ? fallback : Math.round(value)
}

export function bool(fd: FormData, key: string): boolean {
  const value = fd.get(key)
  return value === 'on' || value === 'true' || value === '1'
}

export function list(fd: FormData, key: string): string[] {
  return fd.getAll(key).filter((v): v is string => typeof v === 'string' && v.trim() !== '')
}

/** Keeps a value inside a known set, falling back to a default. */
export function oneOf<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T,
): T {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback
}

export function optionalOneOf<T extends string>(
  value: string | null,
  allowed: readonly T[],
): T | null {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : null
}

export class ValidationError extends Error {}

export type ActionState = {
  ok?: boolean
  error?: string
  message?: string
}

/**
 * Wraps an action so a ValidationError becomes a message in the form instead
 * of an error page. Anything unexpected is logged and reported generically.
 */
export async function guard<T extends ActionState>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    // `redirect()` and `notFound()` signal control flow and must bubble up.
    if (error && typeof error === 'object' && 'digest' in error) throw error
    if (error instanceof ValidationError) return { ok: false, error: error.message } as T
    console.error(error)
    return { ok: false, error: 'Unerwarteter Fehler. Bitte erneut versuchen.' } as T
  }
}
