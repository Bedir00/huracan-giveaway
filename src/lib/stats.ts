import type { Prisma } from '@prisma/client'
import type { SessionUser } from './auth'
import { ACTIVE_STAGES, BOARD_STAGES, STAGES, type Stage } from './constants'
import { addDays, endOfDay, startOfDay } from './dates'
import { prisma } from './db'
import { rate } from './format'

/** Leads an employee sees; admins are unscoped. */
function scope(user: SessionUser): Prisma.LeadWhereInput {
  return user.role === 'ADMIN' ? {} : { ownerId: user.id }
}

export type TodayOverview = {
  leadsToWork: number
  followupsToday: number
  followupsOverdue: number
  newLeads: number
  replies: number
  appointmentsToday: number
  activeLeads: number
  wonLeads: number
  lostLeads: number
}

/**
 * The "Heute" panel. Answers the core question of the app: who has to be
 * contacted today and how much is waiting.
 */
export async function getTodayOverview(user: SessionUser): Promise<TodayOverview> {
  const now = new Date()
  const dayStart = startOfDay(now)
  const dayEnd = endOfDay(now)
  const leadScope = scope(user)
  const taskScope = user.role === 'ADMIN' ? {} : { userId: user.id }
  const apptScope = user.role === 'ADMIN' ? {} : { userId: user.id }

  const [
    leadsToWork,
    followupsToday,
    followupsOverdue,
    newLeads,
    replies,
    appointmentsToday,
    activeLeads,
    wonLeads,
    lostLeads,
  ] = await Promise.all([
    // Due or overdue follow-up, or a fresh lead nobody has planned yet.
    prisma.lead.count({
      where: {
        AND: [
          leadScope,
          { stage: { notIn: ['GEWONNEN', 'VERLOREN'] } },
          {
            OR: [
              { tasks: { some: { done: false, dueAt: { lte: dayEnd } } } },
              {
                AND: [
                  { stage: { in: ['NEU', 'RECHERCHE'] } },
                  { tasks: { none: { done: false } } },
                ],
              },
            ],
          },
        ],
      },
    }),
    prisma.task.count({
      where: { ...taskScope, done: false, dueAt: { gte: dayStart, lte: dayEnd } },
    }),
    prisma.task.count({ where: { ...taskScope, done: false, dueAt: { lt: dayStart } } }),
    prisma.lead.count({ where: { AND: [leadScope, { createdAt: { gte: dayStart } }] } }),
    prisma.lead.count({ where: { AND: [leadScope, { stage: 'ANTWORT' }] } }),
    prisma.appointment.count({
      where: { ...apptScope, startsAt: { gte: dayStart, lte: dayEnd } },
    }),
    prisma.lead.count({ where: { AND: [leadScope, { stage: { in: [...ACTIVE_STAGES] } }] } }),
    prisma.lead.count({ where: { AND: [leadScope, { stage: 'GEWONNEN' }] } }),
    prisma.lead.count({ where: { AND: [leadScope, { stage: 'VERLOREN' }] } }),
  ])

  return {
    leadsToWork,
    followupsToday,
    followupsOverdue,
    newLeads,
    replies,
    appointmentsToday,
    activeLeads,
    wonLeads,
    lostLeads,
  }
}

/** Lead count per pipeline stage, in board order. */
export async function getPipelineCounts(
  user: SessionUser,
): Promise<{ stage: Stage; count: number }[]> {
  const grouped = await prisma.lead.groupBy({
    by: ['stage'],
    where: scope(user),
    _count: { _all: true },
  })
  const map = new Map(grouped.map((g) => [g.stage, g._count._all]))
  return STAGES.map((stage) => ({ stage, count: map.get(stage) ?? 0 }))
}

export type PersonalKpis = {
  created: number
  contacted: number
  replies: number
  appointments: number
  won: number
  revenue: number
}

/** An employee's own numbers - deliberately just the six that matter. */
export async function getPersonalKpis(userId: string, since?: Date): Promise<PersonalKpis> {
  const range = since ? { gte: since } : undefined
  const [created, contacted, replies, appointments, wonAgg] = await Promise.all([
    prisma.lead.count({ where: { foundById: userId, ...(range ? { createdAt: range } : {}) } }),
    prisma.lead.count({
      where: { ownerId: userId, firstContactAt: range ? range : { not: null } },
    }),
    prisma.lead.count({
      where: { ownerId: userId, firstReplyAt: range ? range : { not: null } },
    }),
    prisma.lead.count({
      where: { appointmentSetById: userId, firstAppointmentAt: range ? range : { not: null } },
    }),
    prisma.lead.aggregate({
      where: { closedById: userId, wonAt: range ? range : { not: null } },
      _count: { _all: true },
      _sum: { dealValue: true },
    }),
  ])

  return {
    created,
    contacted,
    replies,
    appointments,
    won: wonAgg._count._all,
    revenue: wonAgg._sum.dealValue ?? 0,
  }
}

export type AdminKpis = {
  total: number
  newThisPeriod: number
  active: number
  contacted: number
  replied: number
  appointments: number
  won: number
  lost: number
  revenue: number
  avgDeal: number
  contactRate: number
  replyRate: number
  appointmentRate: number
  closeRate: number
  overdueFollowups: number
  unassigned: number
}

export async function getAdminKpis(since?: Date): Promise<AdminKpis> {
  const created = since ? { createdAt: { gte: since } } : {}
  const [
    total,
    newThisPeriod,
    active,
    contacted,
    replied,
    appointments,
    wonAgg,
    lost,
    overdueFollowups,
    unassigned,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: since ? { createdAt: { gte: since } } : {} }),
    prisma.lead.count({ where: { stage: { in: [...ACTIVE_STAGES] } } }),
    prisma.lead.count({ where: { ...created, firstContactAt: { not: null } } }),
    prisma.lead.count({ where: { ...created, firstReplyAt: { not: null } } }),
    prisma.lead.count({ where: { ...created, firstAppointmentAt: { not: null } } }),
    prisma.lead.aggregate({
      where: { ...created, stage: 'GEWONNEN' },
      _count: { _all: true },
      _sum: { dealValue: true },
    }),
    prisma.lead.count({ where: { ...created, stage: 'VERLOREN' } }),
    prisma.task.count({ where: { done: false, dueAt: { lt: startOfDay() } } }),
    prisma.lead.count({ where: { ownerId: null } }),
  ])

  const won = wonAgg._count._all
  const revenue = wonAgg._sum.dealValue ?? 0
  const base = since ? newThisPeriod : total

  return {
    total,
    newThisPeriod,
    active,
    contacted,
    replied,
    appointments,
    won,
    lost,
    revenue,
    avgDeal: won ? revenue / won : 0,
    contactRate: rate(contacted, base),
    replyRate: rate(replied, contacted),
    appointmentRate: rate(appointments, contacted),
    closeRate: rate(won, base),
    overdueFollowups,
    unassigned,
  }
}

export type FunnelStep = { stage: Stage; label: string; count: number; share: number }

/**
 * Funnel from lead to customer, built on the high-water stage so leads that
 * were later lost still count for the steps they actually passed.
 */
export async function getFunnel(since?: Date): Promise<FunnelStep[]> {
  const where = since ? { createdAt: { gte: since } } : {}
  const total = await prisma.lead.count({ where })

  const counts = await Promise.all(
    BOARD_STAGES.map(async (stage, index) => {
      if (index === 0) return total
      return prisma.lead.count({
        where: {
          ...where,
          maxStage: { in: BOARD_STAGES.slice(index) as string[] },
        },
      })
    }),
  )

  return BOARD_STAGES.map((stage, index) => ({
    stage,
    label: stage,
    count: counts[index]!,
    share: rate(counts[index]!, total),
  }))
}

export type TeamRow = {
  id: string
  name: string
  role: string
  active: boolean
  leads: number
  activeLeads: number
  created: number
  contacted: number
  replies: number
  appointments: number
  won: number
  revenue: number
  overdue: number
  openTasks: number
  closeRate: number
}

/** One row per team member for the admin comparison table. */
export async function getTeamPerformance(since?: Date): Promise<TeamRow[]> {
  const users = await prisma.user.findMany({ orderBy: [{ active: 'desc' }, { name: 'asc' }] })
  const dayStart = startOfDay()

  return Promise.all(
    users.map(async (user) => {
      const [leads, activeLeads, kpis, overdue, openTasks] = await Promise.all([
        prisma.lead.count({ where: { ownerId: user.id } }),
        prisma.lead.count({ where: { ownerId: user.id, stage: { in: [...ACTIVE_STAGES] } } }),
        getPersonalKpis(user.id, since),
        prisma.task.count({ where: { userId: user.id, done: false, dueAt: { lt: dayStart } } }),
        prisma.task.count({ where: { userId: user.id, done: false } }),
      ])

      return {
        id: user.id,
        name: user.name,
        role: user.role,
        active: user.active,
        leads,
        activeLeads,
        created: kpis.created,
        contacted: kpis.contacted,
        replies: kpis.replies,
        appointments: kpis.appointments,
        won: kpis.won,
        revenue: kpis.revenue,
        overdue,
        openTasks,
        closeRate: rate(kpis.won, leads),
      }
    }),
  )
}

export type SourceRow = {
  source: string
  total: number
  won: number
  revenue: number
  closeRate: number
}

/** Which lead sources actually convert. */
export async function getSourceBreakdown(since?: Date): Promise<SourceRow[]> {
  const where = since ? { createdAt: { gte: since } } : {}
  const [totals, wons] = await Promise.all([
    prisma.lead.groupBy({ by: ['source'], where, _count: { _all: true } }),
    prisma.lead.groupBy({
      by: ['source'],
      where: { ...where, stage: 'GEWONNEN' },
      _count: { _all: true },
      _sum: { dealValue: true },
    }),
  ])

  const wonMap = new Map(wons.map((w) => [w.source, w]))
  return totals
    .map((row) => {
      const won = wonMap.get(row.source)
      const wonCount = won?._count._all ?? 0
      return {
        source: row.source,
        total: row._count._all,
        won: wonCount,
        revenue: won?._sum.dealValue ?? 0,
        closeRate: rate(wonCount, row._count._all),
      }
    })
    .sort((a, b) => b.total - a.total)
}

/** New vs. won leads per day for the activity chart. */
export async function getDailyTrend(
  days = 14,
): Promise<{ date: Date; created: number; won: number }[]> {
  const from = startOfDay(addDays(new Date(), -(days - 1)))
  const [created, won] = await Promise.all([
    prisma.lead.findMany({ where: { createdAt: { gte: from } }, select: { createdAt: true } }),
    prisma.lead.findMany({ where: { wonAt: { gte: from } }, select: { wonAt: true } }),
  ])

  const buckets = new Map<number, { created: number; won: number }>()
  for (let i = 0; i < days; i++) {
    buckets.set(addDays(from, i).getTime(), { created: 0, won: 0 })
  }
  const bump = (date: Date, key: 'created' | 'won') => {
    const bucket = buckets.get(startOfDay(date).getTime())
    if (bucket) bucket[key] += 1
  }
  created.forEach((l) => bump(l.createdAt, 'created'))
  won.forEach((l) => l.wonAt && bump(l.wonAt, 'won'))

  return [...buckets.entries()].map(([time, value]) => ({ date: new Date(time), ...value }))
}
