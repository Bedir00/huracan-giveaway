import Link from 'next/link'
import { Suspense } from 'react'
import { LeadCard } from '@/components/lead/LeadCard'
import { PipelineStrip } from '@/components/PipelineStrip'
import { TaskRow } from '@/components/TaskRow'
import {
  IconAlert,
  IconArrowRight,
  IconCalendar,
  IconInbox,
  IconPlus,
  IconTarget,
} from '@/components/icons'
import {
  Avatar,
  Card,
  CardHeader,
  EmptyState,
  Kpi,
  Meter,
  PageHeader,
  StagePill,
} from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { APPOINTMENT_KIND_LABELS, type AppointmentKind } from '@/lib/constants'
import { endOfDay, fmtDate, fmtTime, startOfDay, startOfMonth, toDateInput } from '@/lib/dates'
import { prisma } from '@/lib/db'
import { fmtCurrency, fmtPercent } from '@/lib/format'
import { byPriority } from '@/lib/filters'
import { LEAD_LIST_INCLUDE, toCardData } from '@/lib/leadList'
import {
  getAdminKpis,
  getPersonalKpis,
  getPipelineCounts,
  getTeamPerformance,
  getTodayOverview,
} from '@/lib/stats'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const user = await requireUser()
  const isAdmin = user.role === 'ADMIN'
  const now = new Date()
  const dayStart = startOfDay(now)
  const dayEnd = endOfDay(now)

  const [overview, pipeline, tasks, appointments, focusLeads, newLeads] = await Promise.all([
    getTodayOverview(user),
    getPipelineCounts(user),
    prisma.task.findMany({
      where: { userId: user.id, done: false, dueAt: { lte: dayEnd } },
      orderBy: { dueAt: 'asc' },
      take: 8,
      include: {
        lead: { select: { id: true, company: true, stage: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.appointment.findMany({
      where: {
        ...(isAdmin ? {} : { userId: user.id }),
        startsAt: { gte: dayStart, lte: dayEnd },
      },
      orderBy: { startsAt: 'asc' },
      include: {
        lead: { select: { id: true, company: true, stage: true } },
        user: { select: { name: true } },
      },
    }),
    // Leads that actually need a call today: due follow-up, or fresh and unplanned.
    prisma.lead.findMany({
      where: {
        ...(isAdmin ? {} : { ownerId: user.id }),
        stage: { notIn: ['GEWONNEN', 'VERLOREN'] },
        OR: [
          { tasks: { some: { done: false, dueAt: { lte: dayEnd } } } },
          { AND: [{ stage: { in: ['NEU', 'RECHERCHE'] } }, { tasks: { none: { done: false } } }] },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: 12,
      include: LEAD_LIST_INCLUDE,
    }),
    prisma.lead.findMany({
      where: { ...(isAdmin ? {} : { ownerId: user.id }), createdAt: { gte: dayStart } },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: {
        id: true,
        company: true,
        stage: true,
        createdAt: true,
        owner: { select: { name: true } },
      },
    }),
  ])

  // The follow-up card lists only this user's tasks, so its hint counts those.
  // For an admin the "Heute" panel is team-wide, which would otherwise claim
  // overdue items that are not on their own list.
  const myOverdue = tasks.filter((task) => task.dueAt < dayStart).length

  const firstName = user.name.split(' ')[0]
  const greeting =
    now.getHours() < 11 ? 'Guten Morgen' : now.getHours() < 18 ? 'Hallo' : 'Guten Abend'

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={`${greeting}, ${firstName}`}
        subtitle={
          overview.leadsToWork > 0
            ? `${overview.leadsToWork} ${overview.leadsToWork === 1 ? 'Lead wartet' : 'Leads warten'} heute auf dich.`
            : 'Für heute ist alles abgearbeitet. Zeit für neue Leads.'
        }
        actions={
          <>
            <Link href="/leads/new" className="btn btn-primary">
              <IconPlus />
              Neuer Lead
            </Link>
            <Link href="/pipeline" className="btn btn-secondary">
              Pipeline
            </Link>
          </>
        }
      />

      {/* --- Heute: the panel the briefing asks for, verbatim --- */}
      <Card>
        <CardHeader
          title="Heute"
          hint={fmtDate(now)}
          action={
            <Link href="/tasks" className="btn btn-ghost btn-sm">
              Aufgaben
              <IconArrowRight />
            </Link>
          }
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <TodayTile
            label="Leads zu bearbeiten"
            value={overview.leadsToWork}
            href="/leads?due=today"
          />
          <TodayTile label="Follow-ups" value={overview.followupsToday} href="/tasks" />
          <TodayTile
            label="Überfällig"
            value={overview.followupsOverdue}
            href="/tasks?filter=overdue"
            tone={overview.followupsOverdue > 0 ? 'urgent' : 'default'}
          />
          <TodayTile
            label="Neue Leads"
            value={overview.newLeads}
            href={`/leads?from=${toDateInput(now)}`}
          />
          <TodayTile label="Neue Antworten" value={overview.replies} href="/leads?stage=ANTWORT" />
          <TodayTile label="Termine" value={overview.appointmentsToday} href="/appointments" />
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* --- the working queue --- */}
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-[0.9375rem] font-semibold">Jetzt dran</h2>
              <Link href="/leads?due=today" className="btn btn-ghost btn-sm">
                Alle
                <IconArrowRight />
              </Link>
            </div>
            {focusLeads.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<IconTarget />}
                  title="Keine offenen Leads für heute"
                  body="Lege neue Leads an oder plane Follow-ups, damit hier wieder etwas auftaucht."
                  action={
                    <Link href="/leads/new" className="btn btn-primary btn-sm">
                      <IconPlus />
                      Lead anlegen
                    </Link>
                  }
                />
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {focusLeads
                  .slice()
                  .sort(byPriority)
                  .slice(0, 6)
                  .map((lead) => (
                    <LeadCard key={lead.id} lead={toCardData(lead)} showOwner={isAdmin} />
                  ))}
              </div>
            )}
          </div>

          {/* The statistics run a dozen aggregate queries. Streaming them keeps
              the working queue above interactive while they load.
              Note: a Suspense boundary must never wrap a form that reads its
              result via useActionState - see (app)/README.md. */}
          <Suspense fallback={<StatsSkeleton />}>
            {isAdmin ? <AdminSection /> : <AgentSection userId={user.id} />}
          </Suspense>
        </div>

        {/* --- right rail --- */}
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Pipeline" hint={`${overview.activeLeads} aktive Leads`} />
            <PipelineStrip counts={pipeline} lost={overview.lostLeads} />
          </Card>

          <Card padded={false}>
            <div className="card-pad pb-0">
              <CardHeader
                title="Meine Follow-ups"
                hint={myOverdue > 0 ? `${myOverdue} überfällig` : 'heute fällig'}
                action={
                  <Link href="/tasks" className="btn btn-ghost btn-sm">
                    Alle
                  </Link>
                }
              />
            </div>
            <div className="px-3 pb-2 divide-row">
              {tasks.length === 0 ? (
                <EmptyState title="Keine offenen Follow-ups" body="Sauber. Nichts überfällig." />
              ) : (
                tasks.map((task) => (
                  <TaskRow
                    key={task.id}
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
                ))
              )}
            </div>
          </Card>

          <Card padded={false}>
            <div className="card-pad pb-0">
              <CardHeader title="Termine heute" />
            </div>
            <div className="px-4 pb-3 divide-row">
              {appointments.length === 0 ? (
                <EmptyState icon={<IconCalendar />} title="Keine Termine heute" />
              ) : (
                appointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center gap-3 py-2.5">
                    <span className="text-[0.8125rem] font-semibold tabular shrink-0">
                      {fmtTime(appointment.startsAt)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <Link
                        href={`/leads/${appointment.lead.id}`}
                        className="block text-[0.8125rem] font-medium truncate hover:text-[var(--accent)]"
                      >
                        {appointment.lead.company}
                      </Link>
                      <span className="text-[0.6875rem] subtle">
                        {APPOINTMENT_KIND_LABELS[appointment.kind as AppointmentKind]} ·{' '}
                        {appointment.durationMin} Min
                      </span>
                    </span>
                    {isAdmin ? <Avatar name={appointment.user.name} /> : null}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card padded={false}>
            <div className="card-pad pb-0">
              <CardHeader title="Neu heute" />
            </div>
            <div className="px-4 pb-3 divide-row">
              {newLeads.length === 0 ? (
                <EmptyState icon={<IconInbox />} title="Heute noch keine neuen Leads" />
              ) : (
                newLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    className="flex items-center gap-2 py-2.5"
                  >
                    <span className="min-w-0 flex-1 text-[0.8125rem] font-medium truncate">
                      {lead.company}
                    </span>
                    <StagePill stage={lead.stage} />
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="card card-pad">
          <div className="skeleton h-2.5 w-20" />
          <div className="skeleton h-7 w-14 mt-3" />
        </div>
      ))}
    </div>
  )
}

function TodayTile({
  label,
  value,
  href,
  tone = 'default',
}: {
  label: string
  value: number
  href: string
  tone?: 'default' | 'urgent'
}) {
  const urgent = tone === 'urgent'
  return (
    <Link
      href={href}
      className="rounded-[10px] border px-3 py-2.5 transition-colors"
      style={{
        borderColor: urgent
          ? 'color-mix(in srgb, var(--danger) 35%, transparent)'
          : 'var(--border)',
        background: urgent ? 'var(--danger-soft)' : 'var(--surface-2)',
      }}
    >
      <span
        className="block text-xl font-semibold tabular leading-none"
        style={{ color: urgent ? 'var(--danger)' : 'var(--text)' }}
      >
        {value}
      </span>
      <span className="block text-[0.6875rem] subtle mt-1 leading-tight">{label}</span>
    </Link>
  )
}

/** Employee dashboard: own numbers only, no team-wide statistics. */
async function AgentSection({ userId }: { userId: string }) {
  const [month, all] = await Promise.all([
    getPersonalKpis(userId, startOfMonth()),
    getPersonalKpis(userId),
  ])

  const rows = [
    { label: 'Leads angelegt', month: month.created, total: all.created },
    { label: 'Leads kontaktiert', month: month.contacted, total: all.contacted },
    { label: 'Antworten', month: month.replies, total: all.replies },
    { label: 'Termine', month: month.appointments, total: all.appointments },
    { label: 'Abschlüsse', month: month.won, total: all.won },
  ]

  return (
    <Card padded={false}>
      <div className="card-pad pb-2">
        <CardHeader title="Meine Kennzahlen" hint="Dieser Monat / insgesamt" />
      </div>
      <div className="px-5 pb-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {rows.map((row) => (
            <div key={row.label}>
              <span className="section-title block">{row.label}</span>
              <span className="kpi block mt-1.5">{row.month}</span>
              <span className="subtle text-[0.6875rem]">insgesamt {row.total}</span>
            </div>
          ))}
        </div>
        {all.revenue > 0 ? (
          <p className="muted text-xs mt-4 pt-3 border-t border-[var(--border)]">
            Zugerechneter Umsatz: <strong>{fmtCurrency(all.revenue)}</strong> · davon diesen Monat{' '}
            {fmtCurrency(month.revenue)}
          </p>
        ) : null}
      </div>
    </Card>
  )
}

/** Admin dashboard: the wider picture plus who is doing what. */
async function AdminSection() {
  const [kpis, team] = await Promise.all([getAdminKpis(), getTeamPerformance(startOfMonth())])
  const activeTeam = team.filter((row) => row.active)

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Leads gesamt" value={kpis.total} hint={`${kpis.active} aktiv`} href="/leads" />
        <Kpi
          label="Gewonnen"
          value={kpis.won}
          hint={fmtCurrency(kpis.revenue)}
          tone="success"
          href="/leads?view=won"
        />
        <Kpi
          label="Abschlussquote"
          value={fmtPercent(kpis.closeRate, 1)}
          hint={`Antwortquote ${fmtPercent(kpis.replyRate)}`}
          href="/analytics"
        />
        <Kpi
          label="Überfällige Follow-ups"
          value={kpis.overdueFollowups}
          tone={kpis.overdueFollowups > 0 ? 'urgent' : 'default'}
          hint={kpis.unassigned > 0 ? `${kpis.unassigned} Leads ohne Zuweisung` : 'im Team'}
          href="/tasks?filter=overdue"
          icon={kpis.overdueFollowups > 0 ? <IconAlert /> : undefined}
        />
      </div>

      <Card padded={false}>
        <div className="card-pad pb-2">
          <CardHeader
            title="Team diesen Monat"
            action={
              <Link href="/analytics" className="btn btn-ghost btn-sm">
                Analytics
                <IconArrowRight />
              </Link>
            }
          />
        </div>
        <div className="scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th>Mitarbeiter</th>
                <th className="table-num">Aktive Leads</th>
                <th className="table-num">Kontaktiert</th>
                <th className="table-num">Antworten</th>
                <th className="table-num">Termine</th>
                <th className="table-num">Abschlüsse</th>
                <th className="table-num">Überfällig</th>
              </tr>
            </thead>
            <tbody>
              {activeTeam.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className="flex items-center gap-2">
                      <Avatar name={row.name} />
                      <span className="font-medium truncate">{row.name}</span>
                    </span>
                  </td>
                  <td className="table-num tabular">{row.activeLeads}</td>
                  <td className="table-num tabular">{row.contacted}</td>
                  <td className="table-num tabular">{row.replies}</td>
                  <td className="table-num tabular">{row.appointments}</td>
                  <td className="table-num tabular font-semibold">{row.won}</td>
                  <td className="table-num tabular">
                    {row.overdue > 0 ? (
                      <span style={{ color: 'var(--danger)' }}>{row.overdue}</span>
                    ) : (
                      <span className="subtle">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {activeTeam.length === 0 ? (
          <EmptyState title="Noch keine Mitarbeiter" body="Lege dein Team unter „Team“ an." />
        ) : null}
      </Card>

      <Card>
        <CardHeader title="Funnel" hint="Anteil aller Leads, die diese Stufe erreicht haben" />
        <div className="flex flex-col gap-2.5">
          {[
            { label: 'Kontaktiert', value: kpis.contactRate, count: kpis.contacted },
            { label: 'Antwort erhalten', value: kpis.replyRate, count: kpis.replied },
            { label: 'Termin vereinbart', value: kpis.appointmentRate, count: kpis.appointments },
            { label: 'Gewonnen', value: kpis.closeRate, count: kpis.won },
          ].map((row) => (
            <div key={row.label}>
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className="text-xs muted">{row.label}</span>
                <span className="text-xs tabular">
                  <strong>{row.count}</strong> · {fmtPercent(row.value, 1)}
                </span>
              </div>
              <Meter value={row.value} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
