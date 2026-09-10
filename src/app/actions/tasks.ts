'use server'

import { revalidatePath } from 'next/cache'
import { assertLeadAccess } from '@/lib/access'
import { requireUser } from '@/lib/auth'
import { parseDateTimeInput } from '@/lib/dates'
import { prisma } from '@/lib/db'
import { type ActionState, guard, req, str, ValidationError } from '@/lib/form'
import { notifyOwner } from '@/lib/notifications'

/**
 * The overdue badge lives in the app shell, so the layout is revalidated as
 * well - that also guarantees the current route is always part of the set,
 * which a `useActionState` transition needs in order to commit.
 */
function refresh(leadId?: string | null): void {
  revalidatePath('/', 'layout')
  revalidatePath('/tasks')
  revalidatePath('/leads')
  if (leadId) revalidatePath(`/leads/${leadId}`)
}

/** Only admins may put a task on someone else's list. */
async function resolveAssignee(userId: string, role: string, requested: string | null) {
  if (!requested || requested === userId) return userId
  if (role !== 'ADMIN') return userId
  const exists = await prisma.user.findUnique({ where: { id: requested }, select: { id: true } })
  return exists?.id ?? userId
}

export async function saveTask(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireUser()
    const taskId = str(fd, 'taskId')
    const leadId = str(fd, 'leadId')
    if (leadId) await assertLeadAccess(user, leadId)

    const title = req(fd, 'title', 'Aufgabe')
    const due = parseDateTimeInput(str(fd, 'dueDate'), str(fd, 'dueTime'))
    if (!due) throw new ValidationError('Bitte ein Datum für das Follow-up angeben.')

    const assignee = await resolveAssignee(user.id, user.role, str(fd, 'userId'))

    if (taskId) {
      // An employee may only edit tasks that are on their own list.
      const existing = await prisma.task.findFirst({
        where: { id: taskId, ...(user.role === 'ADMIN' ? {} : { userId: user.id }) },
        select: { id: true },
      })
      if (!existing) throw new ValidationError('Aufgabe nicht gefunden.')
      await prisma.task.update({
        where: { id: taskId },
        data: { title, dueAt: due.at, hasTime: due.hasTime, userId: assignee, leadId },
      })
    } else {
      await prisma.task.create({
        data: {
          title,
          dueAt: due.at,
          hasTime: due.hasTime,
          userId: assignee,
          leadId,
          createdById: user.id,
        },
      })
      if (leadId && assignee !== user.id) {
        await notifyOwner({
          leadId,
          ownerId: assignee,
          actorId: user.id,
          type: 'TASK_DUE',
          title: 'Neues Follow-up für dich',
          body: title,
        })
      }
    }

    refresh(leadId)
    return { ok: true, message: 'Follow-up gespeichert.' }
  })
}

export async function toggleTask(fd: FormData): Promise<void> {
  const user = await requireUser()
  const taskId = String(fd.get('taskId') ?? '')

  const task = await prisma.task.findFirst({
    where: { id: taskId, ...(user.role === 'ADMIN' ? {} : { userId: user.id }) },
    select: { id: true, done: true, leadId: true, title: true },
  })
  if (!task) return

  const done = !task.done
  await prisma.task.update({
    where: { id: task.id },
    data: { done, doneAt: done ? new Date() : null },
  })

  // Ticking off a follow-up is itself part of the lead's history.
  if (done && task.leadId) {
    await prisma.activity.create({
      data: {
        leadId: task.leadId,
        userId: user.id,
        type: 'FOLLOWUP',
        note: `Follow-up erledigt: ${task.title}`,
      },
    })
  }

  refresh(task.leadId)
}

export async function snoozeTask(fd: FormData): Promise<void> {
  const user = await requireUser()
  const taskId = String(fd.get('taskId') ?? '')
  const days = Number(fd.get('days') ?? 1) || 1

  const task = await prisma.task.findFirst({
    where: { id: taskId, ...(user.role === 'ADMIN' ? {} : { userId: user.id }) },
    select: { id: true, dueAt: true, leadId: true, hasTime: true },
  })
  if (!task) return

  // Snoozing from an overdue date should land in the future, not in the past,
  // so count from today whenever the task is already late.
  const base = task.dueAt < new Date() ? new Date() : task.dueAt
  const next = new Date(base)
  next.setDate(next.getDate() + days)
  if (!task.hasTime) next.setHours(23, 59, 0, 0)

  await prisma.task.update({ where: { id: task.id }, data: { dueAt: next } })
  refresh(task.leadId)
}

export async function deleteTask(fd: FormData): Promise<void> {
  const user = await requireUser()
  const taskId = String(fd.get('taskId') ?? '')
  const task = await prisma.task.findFirst({
    where: { id: taskId, ...(user.role === 'ADMIN' ? {} : { userId: user.id }) },
    select: { id: true, leadId: true },
  })
  if (!task) return
  await prisma.task.delete({ where: { id: task.id } })
  refresh(task.leadId)
}
