import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { safePotentials } from '@/lib/leadList'
import { LeadForm } from '../../LeadForm'

export const metadata = { title: 'Lead bearbeiten' }

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params
  const isAdmin = user.role === 'ADMIN'

  const lead = await prisma.lead.findFirst({
    where: { id, ...(isAdmin ? {} : { ownerId: user.id }) },
  })
  if (!lead) notFound()

  const owners = isAdmin
    ? await prisma.user.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      })
    : [{ id: user.id, name: user.name }]

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={lead.company}
        subtitle="Lead bearbeiten"
        actions={
          <Link href={`/leads/${lead.id}`} className="btn btn-ghost">
            Zurück
          </Link>
        }
      />
      <LeadForm
        mode="edit"
        owners={owners}
        canAssign={isAdmin}
        values={{
          id: lead.id,
          company: lead.company,
          industry: lead.industry ?? '',
          location: lead.location ?? '',
          website: lead.website ?? '',
          instagram: lead.instagram ?? '',
          linkedin: lead.linkedin ?? '',
          phone: lead.phone ?? '',
          email: lead.email ?? '',
          companySize: lead.companySize ?? '',
          source: lead.source,
          stage: lead.stage,
          priority: lead.priority,
          potentials: safePotentials(lead.potentials),
          notes: lead.notes ?? '',
          ownerId: lead.ownerId ?? '',
          dealValue: lead.dealValue ? String(lead.dealValue) : '',
        }}
      />
    </div>
  )
}
