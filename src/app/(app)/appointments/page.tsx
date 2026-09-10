import Link from 'next/link'
import { setAppointmentResult } from '@/app/actions/appointments'
import { IconCalendar } from '@/components/icons'
import { Avatar, Card, EmptyState, PageHeader, StagePill } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import {
  APPOINTMENT_KIND_LABELS,
  APPOINTMENT_RESULT_LABELS,
  APPOINTMENT_RESULTS,
  type AppointmentKind,
  type AppointmentResult,
} from '@/lib/constants'
import { fmtDate, fmtTime, fmtWeekday, isSameDay, startOfDay } from '@/lib/dates'
import { prisma } from '@/lib/db'

export const metadata = { title: 'Termine' }

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; when?: string }>
}) {
  const user = await requireUser()
  const { scope, when } = await searchParams
  const isAdmin = user.role === 'ADMIN'
  const teamScope = isAdmin && scope !== 'me'
  const past = when === 'past'

  const appointments = await prisma.appointment.findMany({
    where: {
      ...(teamScope ? {} : { userId: user.id }),
      startsAt: past ? { lt: startOfDay() } : { gte: startOfDay() },
    },
    orderBy: { startsAt: past ? 'desc' : 'asc' },
    take: 100,
    include: {
      lead: { select: { id: true, company: true, stage: true } },
      user: { select: { name: true } },
    },
  })

  // Group by calendar day so the list reads like an agenda.
  const days: { date: Date; items: typeof appointments }[] = []
  for (const appointment of appointments) {
    const last = days[days.length - 1]
    if (last && isSameDay(last.date, appointment.startsAt)) last.items.push(appointment)
    else days.push({ date: appointment.startsAt, items: [appointment] })
  }

  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      <PageHeader
        title="Termine"
        subtitle={
          past ? 'Vergangene Termine' : 'Alle kommenden Termine, direkt am Lead hinterlegt.'
        }
        actions={
          <Link href="/leads" className="btn btn-secondary">
            Termin am Lead anlegen
          </Link>
        }
      />

      <div className="flex items-center gap-1.5 flex-wrap">
        <Chip href="/appointments" label="Kommende" active={!past} />
        <Chip href="/appointments?when=past" label="Vergangene" active={past} />
        {isAdmin ? (
          <>
            <span className="w-px h-5 bg-[var(--border)] mx-1" />
            <Chip
              href={`/appointments${past ? '?when=past&' : '?'}scope=team`}
              label="Ganzes Team"
              active={teamScope}
            />
            <Chip
              href={`/appointments${past ? '?when=past&' : '?'}scope=me`}
              label="Nur meine"
              active={!teamScope}
            />
          </>
        ) : null}
      </div>

      {days.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconCalendar />}
            title={past ? 'Keine vergangenen Termine' : 'Keine Termine geplant'}
            body="Termine werden direkt am Lead vereinbart - dadurch landet der Lead automatisch auf „Termin vereinbart“."
          />
        </Card>
      ) : (
        days.map((day) => (
          <Card key={day.date.toISOString()} padded={false}>
            <div className="flex items-center gap-2 px-4 pt-3.5 pb-1">
              <h2 className="text-[0.9375rem] font-semibold">
                {fmtWeekday(day.date)}, {fmtDate(day.date)}
              </h2>
              <span className="nav-count">{day.items.length}</span>
            </div>
            <div className="px-4 pb-3 divide-row">
              {day.items.map((appointment) => (
                <div key={appointment.id} className="py-3">
                  <div className="flex items-start gap-3">
                    <span className="text-[0.8125rem] font-semibold tabular w-12 shrink-0">
                      {fmtTime(appointment.startsAt)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/leads/${appointment.lead.id}`}
                          className="text-[0.8125rem] font-medium hover:text-[var(--accent)] truncate"
                        >
                          {appointment.lead.company}
                        </Link>
                        <StagePill stage={appointment.lead.stage} />
                      </div>
                      <p className="subtle text-xs mt-0.5">
                        {APPOINTMENT_KIND_LABELS[appointment.kind as AppointmentKind]} ·{' '}
                        {appointment.durationMin} Min
                        {appointment.participants ? ` · ${appointment.participants}` : ''}
                      </p>
                      {appointment.notes ? (
                        <p className="muted text-xs mt-1 whitespace-pre-line">
                          {appointment.notes}
                        </p>
                      ) : null}

                      <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        {APPOINTMENT_RESULTS.map((result) => {
                          const active = (appointment.result ?? 'OPEN') === result
                          return (
                            <form key={result} action={setAppointmentResult}>
                              <input type="hidden" name="appointmentId" value={appointment.id} />
                              <input type="hidden" name="result" value={result} />
                              <button
                                type="submit"
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
                                {APPOINTMENT_RESULT_LABELS[result as AppointmentResult]}
                              </button>
                            </form>
                          )
                        })}
                      </div>
                    </div>
                    {teamScope ? <Avatar name={appointment.user.name} /> : null}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))
      )}

      <p className="subtle text-xs">
        Kalender-Synchronisierung (Google Calendar) ist bewusst noch nicht aktiv - die Datenstruktur
        ist dafür aber vorbereitet.
      </p>
    </div>
  )
}

function Chip({ href, label, active }: { href: string; label: string; active: boolean }) {
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
