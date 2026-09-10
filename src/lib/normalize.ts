/**
 * Normalisation used for duplicate detection and search.
 *
 * The keys are written to the Lead row on every create/update, so finding a
 * possible duplicate stays a single indexed query instead of a table scan.
 */

const LEGAL_FORMS = [
  'gmbh & co kg',
  'gmbh & co. kg',
  'gmbh',
  'ug haftungsbeschraenkt',
  'ug',
  'ag',
  'kg',
  'ohg',
  'gbr',
  'e k',
  'e v',
  'ev',
  'ltd',
  'inc',
  'llc',
  'bv',
  'sarl',
]

/** Lowercases, strips umlauts, punctuation and common legal forms. */
export function companyKey(name: string | null | undefined): string | null {
  if (!name) return null
  let key = name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

  for (const form of LEGAL_FORMS) {
    if (key.endsWith(` ${form}`)) {
      key = key.slice(0, -(form.length + 1)).trim()
      break
    }
  }
  key = key.replace(/\s+/g, '')
  return key || null
}

/** Reduces any URL or bare host to a comparable registrable-ish domain. */
export function domainKey(website: string | null | undefined): string | null {
  if (!website) return null
  let value = website.trim().toLowerCase()
  if (!value) return null
  value = value.replace(/^[a-z]+:\/\//, '')
  value = value.split('/')[0]!.split('?')[0]!.split('#')[0]!
  value = value.replace(/^www\./, '')
  value = value.replace(/:\d+$/, '')
  return value.includes('.') ? value : null
}

/**
 * Keeps the last 9 digits, which makes +49 30 1234567, 0049301234567 and
 * 030 / 1234567 all compare equal.
 */
export function phoneKey(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 6) return null
  return digits.slice(-9)
}

export function emailKey(email: string | null | undefined): string | null {
  if (!email) return null
  const value = email.trim().toLowerCase()
  return value.includes('@') ? value : null
}

export type DuplicateKeys = {
  companyKey: string | null
  domainKey: string | null
  phoneKey: string | null
  emailKey: string | null
}

export function duplicateKeys(input: {
  company?: string | null
  website?: string | null
  phone?: string | null
  email?: string | null
}): DuplicateKeys {
  return {
    companyKey: companyKey(input.company),
    domainKey: domainKey(input.website),
    phoneKey: phoneKey(input.phone),
    emailKey: emailKey(input.email),
  }
}
