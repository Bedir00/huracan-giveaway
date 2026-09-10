import { prisma } from './db'
import { duplicateKeys } from './normalize'

export type DuplicateMatch = {
  id: string
  company: string
  stage: string
  ownerName: string | null
  reasons: string[]
}

/**
 * Looks for leads that probably already describe the same company.
 *
 * Matching is done on the normalised keys (name without legal form, bare
 * domain, last 9 phone digits, lowercased email) so obvious re-entries are
 * caught without blocking the user - the result is a warning, not a hard stop.
 */
export async function findDuplicates(
  input: {
    company?: string | null
    website?: string | null
    phone?: string | null
    email?: string | null
  },
  excludeLeadId?: string,
): Promise<DuplicateMatch[]> {
  const keys = duplicateKeys(input)
  const or: Record<string, string>[] = []
  if (keys.companyKey) or.push({ companyKey: keys.companyKey })
  if (keys.domainKey) or.push({ domainKey: keys.domainKey })
  if (keys.phoneKey) or.push({ phoneKey: keys.phoneKey })
  if (keys.emailKey) or.push({ emailKey: keys.emailKey })
  if (!or.length) return []

  const candidates = await prisma.lead.findMany({
    where: {
      OR: or,
      ...(excludeLeadId ? { id: { not: excludeLeadId } } : {}),
    },
    select: {
      id: true,
      company: true,
      stage: true,
      companyKey: true,
      domainKey: true,
      phoneKey: true,
      emailKey: true,
      owner: { select: { name: true } },
    },
    take: 5,
  })

  return candidates.map((lead) => {
    const reasons: string[] = []
    if (keys.companyKey && lead.companyKey === keys.companyKey) reasons.push('Firmenname')
    if (keys.domainKey && lead.domainKey === keys.domainKey) reasons.push('Domain')
    if (keys.phoneKey && lead.phoneKey === keys.phoneKey) reasons.push('Telefonnummer')
    if (keys.emailKey && lead.emailKey === keys.emailKey) reasons.push('E-Mail')
    return {
      id: lead.id,
      company: lead.company,
      stage: lead.stage,
      ownerName: lead.owner?.name ?? null,
      reasons,
    }
  })
}
