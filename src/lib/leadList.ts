import type { Prisma } from '@prisma/client'
import { telHref, whatsappHref } from './format'

/** Shared shape for every list, board and dashboard row. */
export const LEAD_LIST_INCLUDE = {
  owner: { select: { id: true, name: true } },
  contacts: { orderBy: { isPrimary: 'desc' }, take: 1 },
  tasks: { where: { done: false }, orderBy: { dueAt: 'asc' }, take: 1 },
  _count: { select: { activities: true, contacts: true } },
} satisfies Prisma.LeadInclude

export type LeadListItem = Prisma.LeadGetPayload<{ include: typeof LEAD_LIST_INCLUDE }>

export type LeadCardData = {
  id: string
  company: string
  stage: string
  priority: string
  industry: string | null
  location: string | null
  source: string
  phone: string | null
  email: string | null
  website: string | null
  dealValue: number | null
  potentials: string[]
  ownerName: string | null
  contactName: string | null
  nextTask: { id: string; title: string; dueAt: Date; hasTime: boolean } | null
  lastContactAt: Date | null
  createdAt: Date
  activityCount: number
  telHref: string | null
  whatsappHref: string | null
}

export function toCardData(lead: LeadListItem): LeadCardData {
  const task = lead.tasks[0]
  return {
    id: lead.id,
    company: lead.company,
    stage: lead.stage,
    priority: lead.priority,
    industry: lead.industry,
    location: lead.location,
    source: lead.source,
    phone: lead.phone,
    email: lead.email,
    website: lead.website,
    dealValue: lead.dealValue,
    potentials: safePotentials(lead.potentials),
    ownerName: lead.owner?.name ?? null,
    contactName: lead.contacts[0]?.name ?? null,
    nextTask: task
      ? { id: task.id, title: task.title, dueAt: task.dueAt, hasTime: task.hasTime }
      : null,
    lastContactAt: lead.lastContactAt,
    createdAt: lead.createdAt,
    activityCount: lead._count.activities,
    telHref: telHref(lead.phone ?? lead.contacts[0]?.phone),
    whatsappHref: whatsappHref(lead.phone ?? lead.contacts[0]?.phone),
  }
}

/** Potentials are stored as a JSON string; never let bad data break a page. */
export function safePotentials(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}
