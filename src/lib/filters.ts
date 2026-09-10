import type { Prisma } from '@prisma/client'
import { ACTIVE_STAGES, STAGES } from './constants'
import { addDays, endOfDay, startOfDay } from './dates'
import { companyKey, phoneKey } from './normalize'
import type { SessionUser } from './auth'

export type LeadFilters = {
  q: string
  stage: string
  owner: string
  industry: string
  source: string
  priority: string
  potential: string
  due: string // '' | 'today' | 'overdue' | 'week' | 'none'
  from: string
  to: string
  sort: string
  view: string // '' | 'active' | 'won' | 'lost' | 'mine' | 'unassigned'
}

const EMPTY: LeadFilters = {
  q: '',
  stage: '',
  owner: '',
  industry: '',
  source: '',
  priority: '',
  potential: '',
  due: '',
  from: '',
  to: '',
  sort: 'recent',
  view: '',
}

type RawParams = Record<string, string | string[] | undefined>

export function readFilters(params: RawParams): LeadFilters {
  const get = (key: keyof LeadFilters): string => {
    const value = params[key]
    const raw = Array.isArray(value) ? value[0] : value
    return (raw ?? '').trim()
  }
  return {
    ...EMPTY,
    q: get('q'),
    stage: get('stage'),
    owner: get('owner'),
    industry: get('industry'),
    source: get('source'),
    priority: get('priority'),
    potential: get('potential'),
    due: get('due'),
    from: get('from'),
    to: get('to'),
    sort: get('sort') || 'recent',
    view: get('view'),
  }
}

export function activeFilterCount(f: LeadFilters): number {
  const keys: (keyof LeadFilters)[] = [
    'stage',
    'owner',
    'industry',
    'source',
    'priority',
    'potential',
    'due',
    'from',
    'to',
    'view',
  ]
  return keys.filter((key) => f[key] !== '').length
}

export function filtersToQuery(f: Partial<LeadFilters>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(f)) {
    if (value && !(key === 'sort' && value === 'recent')) search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

/**
 * Translates the filter bar into a Prisma `where`. The employee/admin
 * visibility rule is applied by the caller through `scope`.
 */
export function leadWhere(f: LeadFilters, user: SessionUser): Prisma.LeadWhereInput {
  const and: Prisma.LeadWhereInput[] = []

  // Employees are hard-scoped to their own leads.
  if (user.role !== 'ADMIN') and.push({ ownerId: user.id })

  if (f.q) {
    const q = f.q
    const or: Prisma.LeadWhereInput[] = [
      { company: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
      { website: { contains: q } },
      { location: { contains: q } },
      { industry: { contains: q } },
      { contacts: { some: { name: { contains: q } } } },
      { contacts: { some: { email: { contains: q } } } },
      { contacts: { some: { phone: { contains: q } } } },
    ]
    const ck = companyKey(q)
    if (ck) or.push({ companyKey: { contains: ck } })
    const pk = phoneKey(q)
    if (pk) or.push({ phoneKey: { contains: pk } })
    and.push({ OR: or })
  }

  if (f.stage && STAGES.includes(f.stage as never)) and.push({ stage: f.stage })
  if (f.owner === 'none') and.push({ ownerId: null })
  else if (f.owner) and.push({ ownerId: f.owner })
  if (f.industry) and.push({ industry: { contains: f.industry } })
  if (f.source) and.push({ source: f.source })
  if (f.priority) and.push({ priority: f.priority })
  if (f.potential) and.push({ potentials: { contains: `"${f.potential}"` } })

  switch (f.view) {
    case 'active':
      and.push({ stage: { in: [...ACTIVE_STAGES] } })
      break
    case 'won':
      and.push({ stage: 'GEWONNEN' })
      break
    case 'lost':
      and.push({ stage: 'VERLOREN' })
      break
    case 'mine':
      and.push({ ownerId: user.id })
      break
    case 'unassigned':
      and.push({ ownerId: null })
      break
  }

  const now = new Date()
  switch (f.due) {
    case 'today':
      and.push({
        tasks: { some: { done: false, dueAt: { gte: startOfDay(now), lte: endOfDay(now) } } },
      })
      break
    case 'overdue':
      and.push({ tasks: { some: { done: false, dueAt: { lt: startOfDay(now) } } } })
      break
    case 'week':
      and.push({ tasks: { some: { done: false, dueAt: { lte: endOfDay(addDays(now, 7)) } } } })
      break
    case 'none':
      and.push({ tasks: { none: { done: false } } })
      break
  }

  // Ignore an unparseable date rather than sending `Invalid Date` to Prisma.
  const from = parseDay(f.from)
  const to = parseDay(f.to)
  if (from) and.push({ createdAt: { gte: startOfDay(from) } })
  if (to) and.push({ createdAt: { lte: endOfDay(to) } })

  return and.length ? { AND: and } : {}
}

function parseDay(value: string): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** HOT first - alphabetical order would put COLD on top. */
const PRIORITY_RANK: Record<string, number> = { HOT: 0, WARM: 1, COLD: 2 }

export function byPriority<T extends { priority: string }>(a: T, b: T): number {
  return (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9)
}

export function leadOrderBy(sort: string): Prisma.LeadOrderByWithRelationInput[] {
  switch (sort) {
    case 'company':
      return [{ company: 'asc' }]
    case 'oldest':
      return [{ createdAt: 'asc' }]
    case 'stage':
      return [{ stage: 'asc' }, { updatedAt: 'desc' }]
    case 'contact':
      return [{ lastContactAt: 'asc' }]
    case 'value':
      return [{ dealValue: 'desc' }]
    default:
      return [{ updatedAt: 'desc' }]
  }
}
