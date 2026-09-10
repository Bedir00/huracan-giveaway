import Link from 'next/link'
import { PageHeader } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { EMPTY_LEAD, LeadForm } from '../LeadForm'

export const metadata = { title: 'Neuer Lead' }

export default async function NewLeadPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>
}) {
  const user = await requireUser()
  const { company } = await searchParams
  const isAdmin = user.role === 'ADMIN'

  // Employees can only own their own leads, so they get a single-entry list.
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
        title="Neuer Lead"
        subtitle="Firma, eine Kontaktmöglichkeit, Quelle, Status, zuständig - das reicht zum Start."
        actions={
          <Link href="/leads" className="btn btn-ghost">
            Zur Liste
          </Link>
        }
      />
      <LeadForm
        mode="create"
        values={{ ...EMPTY_LEAD, company: company ?? '', ownerId: user.id }}
        owners={owners}
        canAssign={isAdmin}
        withFollowup
      />
    </div>
  )
}
