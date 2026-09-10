import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { leadWhere, readFilters } from '@/lib/filters'

/** Backs the global search palette in the header. */
export async function GET(request: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ results: [] }, { status: 401 })

  const q = (new URL(request.url).searchParams.get('q') ?? '').trim()
  if (q.length < 2) return NextResponse.json({ results: [] })

  const leads = await prisma.lead.findMany({
    where: leadWhere({ ...readFilters({}), q }, user),
    orderBy: { updatedAt: 'desc' },
    take: 8,
    select: {
      id: true,
      company: true,
      stage: true,
      location: true,
      phone: true,
      owner: { select: { name: true } },
      contacts: { select: { name: true }, take: 1 },
    },
  })

  return NextResponse.json({
    results: leads.map((lead) => ({
      id: lead.id,
      company: lead.company,
      stage: lead.stage,
      meta: [lead.location, lead.contacts[0]?.name, lead.owner?.name].filter(Boolean).join(' · '),
    })),
  })
}
