/** Link builders shared by the lead card, detail page and quick actions. */

export function mailtoHref(email: string | null | undefined): string | null {
  if (!email) return null
  const trimmed = email.trim()
  return trimmed.includes('@') ? `mailto:${trimmed}` : null
}
