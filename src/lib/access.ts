import { notFound } from 'next/navigation'
import type { SessionUser } from './auth'
import { prisma } from './db'
import { ValidationError } from './form'

/**
 * Loads a lead and enforces visibility: an employee may only touch their own
 * leads, an admin may touch any. Anything else is a 404 rather than a 403 so
 * the app never confirms that an out-of-scope lead exists.
 */
export async function leadForUser<T extends Record<string, unknown>>(
  user: SessionUser,
  leadId: string,
  select: T,
) {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, ...(user.role === 'ADMIN' ? {} : { ownerId: user.id }) },
    select: select as never,
  })
  if (!lead) notFound()
  return lead as never
}

export async function assertLeadAccess(
  user: SessionUser,
  leadId: string,
): Promise<{
  id: string
  company: string
  ownerId: string | null
  stage: string
}> {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, ...(user.role === 'ADMIN' ? {} : { ownerId: user.id }) },
    select: { id: true, company: true, ownerId: true, stage: true },
  })
  if (!lead) throw new ValidationError('Lead nicht gefunden oder kein Zugriff.')
  return lead
}

export function assertAdmin(user: SessionUser): void {
  if (user.role !== 'ADMIN') throw new ValidationError('Nur Admins dürfen das.')
}

/** Employees can only ever put a lead on their own desk. */
export function resolveOwner(user: SessionUser, requested: string | null): string | null {
  if (user.role === 'ADMIN') return requested
  return user.id
}
