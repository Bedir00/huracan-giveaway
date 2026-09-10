const CURRENCY = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

export function fmtCurrency(value: number | null | undefined): string {
  return CURRENCY.format(value ?? 0)
}

export function fmtPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits).replace('.', ',')} %`
}

/** Share of `part` in `total` as a percentage, guarding division by zero. */
export function rate(part: number, total: number): number {
  if (!total) return 0
  return (part / total) * 100
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
}

/** Stable colour per user so avatars stay recognisable across the app. */
export function avatarHue(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 360
  return hash
}

export function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`
}

/** Digits-only phone number for tel: and WhatsApp links. */
export function telHref(phone: string | null | undefined): string | null {
  if (!phone) return null
  const cleaned = phone.replace(/[^\d+]/g, '')
  return cleaned ? `tel:${cleaned}` : null
}

export function whatsappHref(phone: string | null | undefined): string | null {
  if (!phone) return null
  let cleaned = phone.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('+')) cleaned = cleaned.slice(1)
  else if (cleaned.startsWith('00')) cleaned = cleaned.slice(2)
  else if (cleaned.startsWith('0')) cleaned = `49${cleaned.slice(1)}` // assume DE
  return cleaned ? `https://wa.me/${cleaned}` : null
}

export function websiteHref(website: string | null | undefined): string | null {
  if (!website) return null
  const trimmed = website.trim()
  if (!trimmed) return null
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export function instagramHref(handle: string | null | undefined): string | null {
  if (!handle) return null
  const trimmed = handle.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://instagram.com/${trimmed.replace(/^@/, '')}`
}

export function linkedinHref(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://linkedin.com/company/${trimmed.replace(/^\/+/, '')}`
}
