import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { POTENTIAL_LABELS, PRIORITY_LABELS, SOURCE_LABELS, STAGE_LABELS } from '@/lib/constants'
import { toCsv } from '@/lib/csv'
import { fmtDate, fmtDateTime } from '@/lib/dates'
import { prisma } from '@/lib/db'
import { leadOrderBy, leadWhere, readFilters } from '@/lib/filters'
import { EXPORT_HEADERS } from '@/lib/import'

/**
 * CSV export of the current lead selection.
 *
 * The same filters as the list view apply, so "export what I see" works, and
 * the employee/admin scope is enforced through `leadWhere`.
 */
export async function GET(request: Request) {
  const user = await getSessionUser()
  if (!user) return new NextResponse('Nicht angemeldet', { status: 401 })

  const params = Object.fromEntries(new URL(request.url).searchParams.entries())
  const filters = readFilters(params)

  const leads = await prisma.lead.findMany({
    where: leadWhere(filters, user),
    orderBy: leadOrderBy(filters.sort),
    include: {
      owner: { select: { name: true } },
      foundBy: { select: { name: true } },
      appointmentSetBy: { select: { name: true } },
      closedBy: { select: { name: true } },
      contacts: { where: { isPrimary: true }, take: 1 },
      tasks: { where: { done: false }, orderBy: { dueAt: 'asc' }, take: 1 },
    },
  })

  const rows = leads.map((lead) => {
    const contact = lead.contacts[0]
    const nextTask = lead.tasks[0]
    const potentials = (JSON.parse(lead.potentials) as string[])
      .map((key) => POTENTIAL_LABELS[key] ?? key)
      .join(', ')

    return [
      lead.company,
      lead.industry,
      lead.location,
      lead.website,
      lead.instagram,
      lead.linkedin,
      lead.phone,
      lead.email,
      lead.companySize,
      SOURCE_LABELS[lead.source as keyof typeof SOURCE_LABELS] ?? lead.source,
      STAGE_LABELS[lead.stage as keyof typeof STAGE_LABELS] ?? lead.stage,
      PRIORITY_LABELS[lead.priority as keyof typeof PRIORITY_LABELS] ?? lead.priority,
      potentials,
      contact?.name,
      contact?.position,
      contact?.phone,
      contact?.email,
      lead.owner?.name,
      lead.foundBy?.name,
      lead.appointmentSetBy?.name,
      lead.closedBy?.name,
      lead.dealValue,
      nextTask?.title,
      nextTask ? fmtDateTime(nextTask.dueAt) : '',
      lead.lastContactAt ? fmtDate(lead.lastContactAt) : '',
      lead.wonAt ? fmtDate(lead.wonAt) : '',
      lead.lostAt ? fmtDate(lead.lostAt) : '',
      lead.lostReason,
      lead.notes,
      fmtDate(lead.createdAt),
    ]
  })

  const stamp = new Date().toISOString().slice(0, 10)
  return new NextResponse(toCsv(EXPORT_HEADERS, rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads-${stamp}.csv"`,
    },
  })
}
