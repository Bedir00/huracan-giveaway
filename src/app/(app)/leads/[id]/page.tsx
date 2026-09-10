import Link from 'next/link'
import { notFound } from 'next/navigation'
import { deleteLead } from '@/app/actions/leads'
import {
  IconEdit,
  IconExternal,
  IconGlobe,
  IconInstagram,
  IconLinkedin,
  IconMail,
  IconPhone,
  IconSparkle,
  IconTrash,
} from '@/components/icons'
import { ActivityComposer } from '@/components/lead/ActivityComposer'
import { AppointmentSection } from '@/components/lead/AppointmentSection'
import { AssignLead } from '@/components/lead/AssignLead'
import { ContactSection } from '@/components/lead/ContactSection'
import { LeadQuickActions } from '@/components/lead/LeadQuickActions'
import { StageStepper } from '@/components/lead/StageStepper'
import { TaskRow } from '@/components/TaskRow'
import {
  Avatar,
  Card,
  CardHeader,
  DataRow,
  EmptyState,
  PriorityBadge,
  StagePill,
} from '@/components/ui'
import { requireUser } from '@/lib/auth'
import {
  ACTIVITY_ICONS,
  ACTIVITY_LABELS,
  type ActivityType,
  OUTCOME_LABELS,
  type Outcome,
  POTENTIAL_APPROACHES,
  POTENTIAL_LABELS,
  SOURCE_LABELS,
  STAGE_LABELS,
} from '@/lib/constants'
import { fmtDate, fmtDateTime, fmtRelativeDay } from '@/lib/dates'
import { prisma } from '@/lib/db'
import {
  fmtCurrency,
  instagramHref,
  linkedinHref,
  telHref,
  websiteHref,
  whatsappHref,
} from '@/lib/format'
import { safePotentials } from '@/lib/leadList'
import { mailtoHref } from '@/components/lead/helpers'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lead = await prisma.lead.findUnique({ where: { id }, select: { company: true } })
  return { title: lead?.company ?? 'Lead' }
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params
  const isAdmin = user.role === 'ADMIN'

  const lead = await prisma.lead.findFirst({
    where: { id, ...(isAdmin ? {} : { ownerId: user.id }) },
    include: {
      owner: { select: { id: true, name: true } },
      foundBy: { select: { name: true } },
      appointmentSetBy: { select: { name: true } },
      closedBy: { select: { name: true } },
      contacts: { orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }] },
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { user: { select: { name: true } } },
      },
      tasks: {
        orderBy: [{ done: 'asc' }, { dueAt: 'asc' }],
        include: { user: { select: { name: true } } },
      },
      appointments: {
        orderBy: { startsAt: 'desc' },
        include: { user: { select: { name: true } } },
      },
    },
  })
  if (!lead) notFound()

  const owners = isAdmin
    ? await prisma.user.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      })
    : []

  const potentials = safePotentials(lead.potentials)
  const phone = lead.phone ?? lead.contacts[0]?.phone ?? null
  const email = lead.email ?? lead.contacts[0]?.email ?? null
  const openTasks = lead.tasks.filter((task) => !task.done)
  const doneTasks = lead.tasks.filter((task) => task.done)

  const links = [
    { href: websiteHref(lead.website), label: lead.website, icon: <IconGlobe /> },
    { href: instagramHref(lead.instagram), label: lead.instagram, icon: <IconInstagram /> },
    { href: linkedinHref(lead.linkedin), label: lead.linkedin, icon: <IconLinkedin /> },
  ].filter((link) => link.href)

  return (
    <div className="flex flex-col gap-5">
      {/* --- header --- */}
      <div>
        <Link href="/leads" className="subtle text-xs hover:text-[var(--text)]">
          ← Leads
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3 mt-2">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold">{lead.company}</h1>
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <StagePill stage={lead.stage} />
              <PriorityBadge priority={lead.priority} />
              <span className="badge badge-neutral">
                {SOURCE_LABELS[lead.source as keyof typeof SOURCE_LABELS] ?? lead.source}
              </span>
              {lead.dealValue ? (
                <span className="badge badge-success">{fmtCurrency(lead.dealValue)}</span>
              ) : null}
              {lead.industry ? <span className="subtle text-xs">{lead.industry}</span> : null}
              {lead.location ? <span className="subtle text-xs">· {lead.location}</span> : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/leads/${lead.id}/edit`} className="btn btn-secondary">
              <IconEdit />
              Bearbeiten
            </Link>
            {isAdmin ? (
              <form action={deleteLead}>
                <input type="hidden" name="leadId" value={lead.id} />
                <button type="submit" className="btn btn-danger btn-icon" title="Lead löschen">
                  <IconTrash />
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </div>

      {/* --- quick actions: the reason someone opens this page --- */}
      <Card>
        <LeadQuickActions
          lead={{
            id: lead.id,
            company: lead.company,
            stage: lead.stage,
            phone,
            email,
            telHref: telHref(phone),
            whatsappHref: whatsappHref(phone),
          }}
        />
        {links.length > 0 ? (
          <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-[var(--border)]">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href!}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-ghost btn-sm"
              >
                {link.icon}
                <span className="truncate max-w-[12rem]">{link.label}</span>
                <IconExternal />
              </a>
            ))}
          </div>
        ) : null}
      </Card>

      <Card>
        <CardHeader title="Pipeline" hint="Auf eine Stufe tippen, um den Lead zu bewegen" />
        <StageStepper leadId={lead.id} stage={lead.stage} dealValue={lead.dealValue} />
      </Card>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* --- next steps --- */}
          <Card padded={false}>
            <div className="card-pad pb-2">
              <CardHeader
                title="Nächste Schritte"
                hint={
                  openTasks.length === 0
                    ? 'Kein nächster Schritt hinterlegt - unten festlegen'
                    : `${openTasks.length} offen`
                }
              />
            </div>
            <div className="px-4 pb-3 divide-row">
              {openTasks.length === 0 ? (
                <EmptyState
                  title="Kein nächster Schritt"
                  body="Jeder aktive Lead sollte eine nächste Aufgabe haben - über „Follow-up“ oben festlegen."
                />
              ) : (
                openTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    showAssignee={isAdmin}
                    task={{
                      id: task.id,
                      title: task.title,
                      dueAt: task.dueAt,
                      hasTime: task.hasTime,
                      done: task.done,
                      lead: null,
                      assignee: task.user,
                    }}
                  />
                ))
              )}
            </div>
            {doneTasks.length > 0 ? (
              <details className="px-4 pb-3">
                <summary className="subtle text-xs cursor-pointer py-1">
                  {doneTasks.length} erledigte Follow-ups anzeigen
                </summary>
                <div className="divide-row mt-1">
                  {doneTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={{
                        id: task.id,
                        title: task.title,
                        dueAt: task.dueAt,
                        hasTime: task.hasTime,
                        done: task.done,
                        lead: null,
                        assignee: task.user,
                      }}
                    />
                  ))}
                </div>
              </details>
            ) : null}
          </Card>

          {/* --- activity log --- */}
          <Card>
            <CardHeader title="Aktivität dokumentieren" />
            <ActivityComposer leadId={lead.id} />
          </Card>

          <Card padded={false}>
            <div className="card-pad pb-2">
              <CardHeader title="Historie" hint={`${lead.activities.length} Einträge`} />
            </div>
            <div className="px-5 pb-5">
              {lead.activities.length === 0 ? (
                <EmptyState title="Noch keine Aktivitäten" />
              ) : (
                <div className="timeline flex flex-col gap-3.5">
                  {lead.activities.map((activity) => (
                    <div key={activity.id} className="timeline-item">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-[0.8125rem] font-medium">
                          <span aria-hidden="true" className="mr-1">
                            {ACTIVITY_ICONS[activity.type as ActivityType] ?? '•'}
                          </span>
                          {ACTIVITY_LABELS[activity.type as ActivityType] ?? activity.type}
                        </span>
                        {activity.outcome ? (
                          <span className="badge badge-neutral">
                            {OUTCOME_LABELS[activity.outcome as Outcome] ?? activity.outcome}
                          </span>
                        ) : null}
                        <span className="subtle text-[0.6875rem] ml-auto">
                          {fmtDateTime(activity.createdAt)}
                          {activity.user ? ` · ${activity.user.name}` : ''}
                        </span>
                      </div>
                      {activity.note ? (
                        <p className="muted text-[0.8125rem] mt-0.5 whitespace-pre-line">
                          {activity.note}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <ContactSection
            leadId={lead.id}
            contacts={lead.contacts.map((contact) => ({
              id: contact.id,
              name: contact.name,
              position: contact.position,
              phone: contact.phone,
              email: contact.email,
              preferredChannel: contact.preferredChannel,
              isPrimary: contact.isPrimary,
            }))}
          />

          <AppointmentSection
            leadId={lead.id}
            appointments={lead.appointments.map((appointment) => ({
              id: appointment.id,
              startsAt: appointment.startsAt.toISOString(),
              durationMin: appointment.durationMin,
              kind: appointment.kind,
              participants: appointment.participants,
              notes: appointment.notes,
              result: appointment.result,
              userName: appointment.user.name,
            }))}
          />
        </div>

        {/* --- right rail --- */}
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Zuständigkeit" />
            {isAdmin ? (
              <AssignLead
                leadId={lead.id}
                ownerId={lead.ownerId}
                owners={owners}
                currentUserId={user.id}
              />
            ) : (
              <div className="flex items-center gap-2">
                {lead.owner ? (
                  <>
                    <Avatar name={lead.owner.name} />
                    <span className="text-[0.8125rem]">{lead.owner.name}</span>
                  </>
                ) : (
                  <span className="badge badge-warning">Nicht zugewiesen</span>
                )}
              </div>
            )}

            {/* Attribution, stored from day one so a commission model can be
                switched on later without reconstructing history. */}
            <div className="mt-3 pt-3 border-t border-[var(--border)]">
              <p className="section-title mb-1.5">Zurechnung</p>
              <DataRow label="Gefunden von">{lead.foundBy?.name ?? '—'}</DataRow>
              <DataRow label="Bearbeitet von">{lead.owner?.name ?? '—'}</DataRow>
              <DataRow label="Termin vereinbart">{lead.appointmentSetBy?.name ?? '—'}</DataRow>
              <DataRow label="Abschluss">{lead.closedBy?.name ?? '—'}</DataRow>
            </div>
          </Card>

          {potentials.length > 0 ? (
            <Card>
              <CardHeader title="Erkanntes Potenzial" />
              <div className="flex flex-wrap gap-1.5">
                {potentials.map((key) => (
                  <span key={key} className="badge badge-accent">
                    {POTENTIAL_LABELS[key] ?? key}
                  </span>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[var(--border)]">
                <p className="section-title mb-2 flex items-center gap-1.5">
                  <IconSparkle />
                  Vorgeschlagener Ansatz
                </p>
                <ul className="flex flex-col gap-1.5">
                  {potentials.map((key) =>
                    POTENTIAL_APPROACHES[key] ? (
                      <li key={key} className="muted text-[0.8125rem] flex gap-1.5">
                        <span style={{ color: 'var(--accent)' }}>—</span>
                        {POTENTIAL_APPROACHES[key]}
                      </li>
                    ) : null,
                  )}
                </ul>
              </div>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Unternehmensdaten" />
            <div className="divide-row">
              <DataRow label="Telefon">
                {lead.phone ? (
                  <a
                    href={telHref(lead.phone) ?? '#'}
                    className="link inline-flex items-center gap-1"
                  >
                    <IconPhone />
                    {lead.phone}
                  </a>
                ) : (
                  '—'
                )}
              </DataRow>
              <DataRow label="E-Mail">
                {lead.email ? (
                  <a
                    href={mailtoHref(lead.email) ?? '#'}
                    className="link inline-flex items-center gap-1"
                  >
                    <IconMail />
                    <span className="truncate">{lead.email}</span>
                  </a>
                ) : (
                  '—'
                )}
              </DataRow>
              <DataRow label="Website">
                {lead.website ? (
                  <a
                    href={websiteHref(lead.website)!}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="link"
                  >
                    {lead.website}
                  </a>
                ) : (
                  '—'
                )}
              </DataRow>
              <DataRow label="Instagram">{lead.instagram ?? '—'}</DataRow>
              <DataRow label="LinkedIn">{lead.linkedin ?? '—'}</DataRow>
              <DataRow label="Branche">{lead.industry ?? '—'}</DataRow>
              <DataRow label="Standort">{lead.location ?? '—'}</DataRow>
              <DataRow label="Größe">
                {lead.companySize ? `${lead.companySize} Mitarbeiter` : '—'}
              </DataRow>
            </div>
          </Card>

          <Card>
            <CardHeader title="Verlauf" />
            <div className="divide-row">
              <DataRow label="Angelegt">{fmtDate(lead.createdAt)}</DataRow>
              <DataRow label="Letzter Kontakt">
                {lead.lastContactAt ? fmtRelativeDay(lead.lastContactAt) : 'noch nie'}
              </DataRow>
              <DataRow label="Erstkontakt">{fmtDate(lead.firstContactAt)}</DataRow>
              <DataRow label="Erste Antwort">{fmtDate(lead.firstReplyAt)}</DataRow>
              <DataRow label="Termin">{fmtDate(lead.firstAppointmentAt)}</DataRow>
              <DataRow label="Angebot">{fmtDate(lead.firstOfferAt)}</DataRow>
              <DataRow label="Weiteste Stufe">
                {STAGE_LABELS[lead.maxStage as keyof typeof STAGE_LABELS] ?? lead.maxStage}
              </DataRow>
              {lead.wonAt ? <DataRow label="Gewonnen">{fmtDate(lead.wonAt)}</DataRow> : null}
              {lead.lostAt ? (
                <>
                  <DataRow label="Verloren">{fmtDate(lead.lostAt)}</DataRow>
                  <DataRow label="Grund">{lead.lostReason ?? '—'}</DataRow>
                </>
              ) : null}
            </div>
          </Card>

          {lead.notes ? (
            <Card>
              <CardHeader title="Notizen" />
              <p className="muted text-[0.8125rem] whitespace-pre-line">{lead.notes}</p>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}
