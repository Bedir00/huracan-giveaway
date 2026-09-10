import Link from 'next/link'
import { IconInbox, IconPlus, IconUpload } from '@/components/icons'
import { LeadCard } from '@/components/lead/LeadCard'
import { Avatar, Card, EmptyState, PageHeader, PriorityBadge, StagePill } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { SOURCE_LABELS } from '@/lib/constants'
import { fmtRelativeDay, fmtTime, startOfDay } from '@/lib/dates'
import { prisma } from '@/lib/db'
import { leadOrderBy, leadWhere, readFilters } from '@/lib/filters'
import { fmtCurrency } from '@/lib/format'
import { LEAD_LIST_INCLUDE, toCardData } from '@/lib/leadList'
import { LeadFilterBar } from './LeadFilterBar'

export const metadata = { title: 'Leads' }

const PAGE_SIZE = 50

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await requireUser()
  const params = await searchParams
  const filters = readFilters(params)
  const page = Math.max(1, Number(Array.isArray(params.page) ? params.page[0] : params.page) || 1)
  const isAdmin = user.role === 'ADMIN'

  const where = leadWhere(filters, user)

  const [leads, total, owners, industryRows] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: leadOrderBy(filters.sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: LEAD_LIST_INCLUDE,
    }),
    prisma.lead.count({ where }),
    isAdmin
      ? prisma.user.findMany({
          where: { active: true },
          orderBy: { name: 'asc' },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    prisma.lead.findMany({
      where: user.role === 'ADMIN' ? {} : { ownerId: user.id },
      distinct: ['industry'],
      select: { industry: true },
      orderBy: { industry: 'asc' },
    }),
  ])

  const industries = industryRows
    .map((row) => row.industry)
    .filter((value): value is string => Boolean(value))

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const buildPageHref = (target: number) => {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      const raw = Array.isArray(value) ? value[0] : value
      if (raw && key !== 'page') search.set(key, raw)
    }
    if (target > 1) search.set('page', String(target))
    const query = search.toString()
    return `/leads${query ? `?${query}` : ''}`
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Leads"
        subtitle={isAdmin ? 'Alle Leads im Team' : 'Deine Leads'}
        actions={
          <>
            <Link href="/settings/import" className="btn btn-secondary">
              <IconUpload />
              <span className="hidden sm:inline">Import</span>
            </Link>
            <Link href="/leads/new" className="btn btn-primary">
              <IconPlus />
              Neuer Lead
            </Link>
          </>
        }
      />

      <LeadFilterBar
        owners={owners.map((o) => ({ value: o.id, label: o.name }))}
        industries={industries}
        isAdmin={isAdmin}
        total={total}
      />

      {leads.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconInbox />}
            title="Keine Leads gefunden"
            body="Passe die Filter an oder lege einen neuen Lead an - das dauert weniger als 20 Sekunden."
            action={
              <Link href="/leads/new" className="btn btn-primary btn-sm">
                <IconPlus />
                Lead anlegen
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          {/* Phones get cards with quick actions, desktop gets a dense table. */}
          <div className="grid gap-3 sm:grid-cols-2 xl:hidden">
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={toCardData(lead)} showOwner={isAdmin} />
            ))}
          </div>

          <Card className="hidden xl:block overflow-hidden" padded={false}>
            <div className="scroll-x">
              <table className="table">
                <thead>
                  <tr>
                    <th>Firma</th>
                    <th>Status</th>
                    <th>Prio</th>
                    <th>Nächster Schritt</th>
                    <th>Ansprechpartner</th>
                    {/* Held back until the viewport can show them without clipping. */}
                    <th className="hidden 2xl:table-cell">Quelle</th>
                    {isAdmin ? <th>Zuständig</th> : null}
                    <th className="table-num">Wert</th>
                    <th className="table-num hidden 2xl:table-cell">Kontakt</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => {
                    const card = toCardData(lead)
                    const overdue = card.nextTask ? card.nextTask.dueAt < startOfDay() : false
                    return (
                      <tr key={lead.id}>
                        <td>
                          <Link
                            href={`/leads/${lead.id}`}
                            prefetch={false}
                            className="block min-w-0"
                          >
                            <span className="font-medium block truncate max-w-[16rem]">
                              {lead.company}
                            </span>
                            <span className="subtle text-[0.6875rem] block truncate max-w-[16rem]">
                              {[lead.industry, lead.location].filter(Boolean).join(' · ') || '—'}
                            </span>
                          </Link>
                        </td>
                        <td>
                          <StagePill stage={lead.stage} />
                        </td>
                        <td>
                          <PriorityBadge priority={lead.priority} />
                        </td>
                        <td>
                          {card.nextTask ? (
                            <span
                              className="block max-w-[14rem] truncate"
                              style={overdue ? { color: 'var(--danger)' } : undefined}
                            >
                              {card.nextTask.title}
                              <span
                                className="subtle text-[0.6875rem] ml-1"
                                style={overdue ? { color: 'var(--danger)' } : undefined}
                              >
                                {fmtRelativeDay(card.nextTask.dueAt)}
                                {card.nextTask.hasTime ? `, ${fmtTime(card.nextTask.dueAt)}` : ''}
                              </span>
                            </span>
                          ) : (
                            <span className="badge badge-warning">Kein nächster Schritt</span>
                          )}
                        </td>
                        <td className="muted truncate max-w-[10rem]">{card.contactName ?? '—'}</td>
                        <td className="muted text-[0.75rem] hidden 2xl:table-cell">
                          {SOURCE_LABELS[lead.source as keyof typeof SOURCE_LABELS] ?? lead.source}
                        </td>
                        {isAdmin ? (
                          <td>
                            {lead.owner ? (
                              <span className="flex items-center gap-1.5">
                                <Avatar name={lead.owner.name} />
                                <span className="truncate max-w-[7rem]">{lead.owner.name}</span>
                              </span>
                            ) : (
                              <span className="badge badge-warning">offen</span>
                            )}
                          </td>
                        ) : null}
                        <td className="table-num tabular">
                          {lead.dealValue ? fmtCurrency(lead.dealValue) : '—'}
                        </td>
                        <td className="table-num subtle text-[0.75rem] hidden 2xl:table-cell">
                          {lead.lastContactAt ? fmtRelativeDay(lead.lastContactAt) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {pageCount > 1 ? (
            <div className="flex items-center justify-between gap-2">
              <span className="subtle text-xs">
                Seite {page} von {pageCount}
              </span>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Link href={buildPageHref(page - 1)} className="btn btn-secondary btn-sm">
                    Zurück
                  </Link>
                ) : null}
                {page < pageCount ? (
                  <Link href={buildPageHref(page + 1)} className="btn btn-secondary btn-sm">
                    Weiter
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
