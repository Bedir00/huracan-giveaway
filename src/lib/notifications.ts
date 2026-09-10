import type { SessionUser } from './auth'
import { addDays, endOfDay, fmtTime, startOfDay } from './dates'
import { prisma } from './db'

export type NotificationItem = {
  id: string
  type: string
  title: string
  body: string | null
  href: string
  createdAt: Date
  tone: 'urgent' | 'due' | 'info'
  persisted: boolean
}

/**
 * The notification bell.
 *
 * Two sources are merged: rows written when something happens to someone else's
 * lead (assignment, changes), and items derived live from open follow-ups and
 * upcoming appointments. Derived items need no storage and disappear on their
 * own once the follow-up is ticked off - which keeps the bell quiet instead of
 * building up a backlog of stale alerts.
 */
export async function getNotifications(user: SessionUser): Promise<NotificationItem[]> {
  const now = new Date()
  const dayStart = startOfDay(now)
  const dayEnd = endOfDay(now)

  const [stored, overdueTasks, dueTasks, todaysAppointments] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id, readAt: null },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.task.findMany({
      where: { userId: user.id, done: false, dueAt: { lt: dayStart } },
      orderBy: { dueAt: 'asc' },
      take: 10,
      include: { lead: { select: { id: true, company: true } } },
    }),
    prisma.task.findMany({
      where: { userId: user.id, done: false, dueAt: { gte: dayStart, lte: dayEnd } },
      orderBy: { dueAt: 'asc' },
      take: 10,
      include: { lead: { select: { id: true, company: true } } },
    }),
    prisma.appointment.findMany({
      where: { userId: user.id, startsAt: { gte: now, lte: endOfDay(addDays(now, 1)) } },
      orderBy: { startsAt: 'asc' },
      take: 10,
      include: { lead: { select: { id: true, company: true } } },
    }),
  ])

  const items: NotificationItem[] = []

  for (const task of overdueTasks) {
    items.push({
      id: `task-over-${task.id}`,
      type: 'TASK_OVERDUE',
      title: 'Follow-up überfällig',
      body: `${task.title}${task.lead ? ` · ${task.lead.company}` : ''}`,
      href: task.lead ? `/leads/${task.lead.id}` : '/tasks',
      createdAt: task.dueAt,
      tone: 'urgent',
      persisted: false,
    })
  }

  for (const task of dueTasks) {
    items.push({
      id: `task-due-${task.id}`,
      type: 'TASK_DUE',
      title: 'Follow-up heute fällig',
      body: `${task.title}${task.lead ? ` · ${task.lead.company}` : ''}`,
      href: task.lead ? `/leads/${task.lead.id}` : '/tasks',
      createdAt: task.dueAt,
      tone: 'due',
      persisted: false,
    })
  }

  for (const appointment of todaysAppointments) {
    const today = appointment.startsAt <= dayEnd
    items.push({
      id: `appt-${appointment.id}`,
      type: today ? 'APPOINTMENT_TODAY' : 'APPOINTMENT_SOON',
      title: today ? `Termin heute, ${fmtTime(appointment.startsAt)}` : 'Termin morgen',
      body: appointment.lead.company,
      href: `/leads/${appointment.lead.id}`,
      createdAt: appointment.startsAt,
      tone: today ? 'due' : 'info',
      persisted: false,
    })
  }

  for (const row of stored) {
    items.push({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      href: row.leadId ? `/leads/${row.leadId}` : '/',
      createdAt: row.createdAt,
      tone: 'info',
      persisted: true,
    })
  }

  const order = { urgent: 0, due: 1, info: 2 } as const
  return items.sort(
    (a, b) => order[a.tone] - order[b.tone] || b.createdAt.getTime() - a.createdAt.getTime(),
  )
}

/**
 * Notifies a lead's owner about something that happened to their lead.
 * Never notifies the person who did it - self-inflicted noise is the fastest
 * way to make people ignore the bell.
 */
export async function notifyOwner(params: {
  leadId: string
  ownerId: string | null | undefined
  actorId: string
  type: string
  title: string
  body?: string
}): Promise<void> {
  const { leadId, ownerId, actorId, type, title, body } = params
  if (!ownerId || ownerId === actorId) return
  await prisma.notification.create({
    data: { userId: ownerId, leadId, type, title, body: body ?? null },
  })
}
