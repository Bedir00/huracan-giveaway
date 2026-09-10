import Link from 'next/link'
import { IconCheck } from '@/components/icons'
import { TaskCreateButton } from '@/components/TaskCreateButton'
import { TaskRow } from '@/components/TaskRow'
import { Card, EmptyState, PageHeader } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { addDays, endOfDay, startOfDay } from '@/lib/dates'
import { prisma } from '@/lib/db'

export const metadata = { title: 'Aufgaben' }

const TASK_INCLUDE = {
  lead: { select: { id: true, company: true, stage: true } },
  user: { select: { name: true } },
} as const

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; scope?: string }>
}) {
  const user = await requireUser()
  const { filter, scope } = await searchParams
  const isAdmin = user.role === 'ADMIN'
  const teamScope = isAdmin && scope === 'team'

  const userFilter = teamScope ? {} : { userId: user.id }
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)

  const [overdue, today, tomorrow, week, later, done, leads, members] = await Promise.all([
    prisma.task.findMany({
      where: { ...userFilter, done: false, dueAt: { lt: todayStart } },
      orderBy: { dueAt: 'asc' },
      include: TASK_INCLUDE,
    }),
    prisma.task.findMany({
      where: { ...userFilter, done: false, dueAt: { gte: todayStart, lte: todayEnd } },
      orderBy: { dueAt: 'asc' },
      include: TASK_INCLUDE,
    }),
    prisma.task.findMany({
      where: {
        ...userFilter,
        done: false,
        dueAt: { gt: todayEnd, lte: endOfDay(addDays(now, 1)) },
      },
      orderBy: { dueAt: 'asc' },
      include: TASK_INCLUDE,
    }),
    prisma.task.findMany({
      where: {
        ...userFilter,
        done: false,
        dueAt: { gt: endOfDay(addDays(now, 1)), lte: endOfDay(addDays(now, 7)) },
      },
      orderBy: { dueAt: 'asc' },
      include: TASK_INCLUDE,
    }),
    prisma.task.findMany({
      where: { ...userFilter, done: false, dueAt: { gt: endOfDay(addDays(now, 7)) } },
      orderBy: { dueAt: 'asc' },
      take: 50,
      include: TASK_INCLUDE,
    }),
    prisma.task.findMany({
      where: { ...userFilter, done: true },
      orderBy: { doneAt: 'desc' },
      take: 20,
      include: TASK_INCLUDE,
    }),
    prisma.lead.findMany({
      where: isAdmin ? {} : { ownerId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 200,
      select: { id: true, company: true },
    }),
    isAdmin
      ? prisma.user.findMany({
          where: { active: true },
          orderBy: { name: 'asc' },
          select: { id: true, name: true },
        })
      : Promise.resolve([{ id: user.id, name: user.name }]),
  ])

  const groups = [
    { key: 'overdue', title: 'Überfällig', tone: 'urgent' as const, tasks: overdue },
    { key: 'today', title: 'Heute', tone: 'due' as const, tasks: today },
    { key: 'tomorrow', title: 'Morgen', tone: 'default' as const, tasks: tomorrow },
    { key: 'week', title: 'Diese Woche', tone: 'default' as const, tasks: week },
    { key: 'later', title: 'Später', tone: 'default' as const, tasks: later },
  ]

  const visibleGroups = filter === 'overdue' ? groups.filter((g) => g.key === 'overdue') : groups
  const openCount = overdue.length + today.length + tomorrow.length + week.length + later.length

  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      <PageHeader
        title="Aufgaben"
        subtitle={
          openCount === 0
            ? 'Keine offenen Follow-ups. Sauber.'
            : `${openCount} offen${overdue.length ? `, davon ${overdue.length} überfällig` : ''}`
        }
        actions={<TaskCreateButton leads={leads} members={members} currentUserId={user.id} />}
      />

      <div className="flex items-center gap-1.5 flex-wrap">
        <FilterChip href="/tasks" label="Alle" active={!filter && !teamScope} />
        <FilterChip
          href="/tasks?filter=overdue"
          label="Nur überfällig"
          active={filter === 'overdue'}
        />
        {isAdmin ? (
          <>
            <span className="w-px h-5 bg-[var(--border)] mx-1" />
            <FilterChip href="/tasks" label="Meine" active={!teamScope} />
            <FilterChip href="/tasks?scope=team" label="Ganzes Team" active={teamScope} />
          </>
        ) : null}
      </div>

      {openCount === 0 ? (
        <Card>
          <EmptyState
            icon={<IconCheck />}
            title="Alles abgearbeitet"
            body="Es sind keine Follow-ups offen. Zeit, neue Leads anzulegen."
            action={
              <Link href="/leads/new" className="btn btn-primary btn-sm">
                Lead anlegen
              </Link>
            }
          />
        </Card>
      ) : (
        visibleGroups.map((group) =>
          group.tasks.length === 0 ? null : (
            <Card key={group.key} padded={false}>
              <div className="flex items-center gap-2 px-4 pt-3.5 pb-1">
                <h2
                  className="text-[0.9375rem] font-semibold"
                  style={group.tone === 'urgent' ? { color: 'var(--danger)' } : undefined}
                >
                  {group.title}
                </h2>
                <span
                  className="nav-count"
                  data-tone={group.tone === 'urgent' ? 'urgent' : undefined}
                >
                  {group.tasks.length}
                </span>
              </div>
              <div className="px-3 pb-2 divide-row">
                {group.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    showAssignee={teamScope}
                    task={{
                      id: task.id,
                      title: task.title,
                      dueAt: task.dueAt,
                      hasTime: task.hasTime,
                      done: task.done,
                      lead: task.lead,
                      assignee: task.user,
                    }}
                  />
                ))}
              </div>
            </Card>
          ),
        )
      )}

      {done.length > 0 ? (
        <Card padded={false}>
          <details>
            <summary className="px-4 py-3 cursor-pointer text-[0.8125rem] font-medium">
              Zuletzt erledigt ({done.length})
            </summary>
            <div className="px-3 pb-2 divide-row">
              {done.map((task) => (
                <TaskRow
                  key={task.id}
                  showAssignee={teamScope}
                  task={{
                    id: task.id,
                    title: task.title,
                    dueAt: task.dueAt,
                    hasTime: task.hasTime,
                    done: task.done,
                    lead: task.lead,
                    assignee: task.user,
                  }}
                />
              ))}
            </div>
          </details>
        </Card>
      ) : null}
    </div>
  )
}

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className="chip-toggle"
      style={
        active
          ? {
              background: 'var(--accent-soft)',
              borderColor: 'var(--accent-border)',
              color: 'var(--accent)',
              fontWeight: 600,
            }
          : undefined
      }
    >
      {label}
    </Link>
  )
}
