import Link from 'next/link'
import { KanbanBoard } from '@/components/KanbanBoard'
import { IconPlus } from '@/components/icons'
import { PageHeader } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { BOARD_STAGES } from '@/lib/constants'
import { prisma } from '@/lib/db'
import { safePotentials } from '@/lib/leadList'

export const metadata = { title: 'Pipeline' }

/** Board cap: enough for a small team, small enough to stay snappy. */
const MAX_CARDS = 400

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ owner?: string }>
}) {
  const user = await requireUser()
  const { owner } = await searchParams
  const isAdmin = user.role === 'ADMIN'

  const ownerFilter = isAdmin
    ? owner === 'me'
      ? { ownerId: user.id }
      : owner && owner !== 'all'
        ? { ownerId: owner }
        : {}
    : { ownerId: user.id }

  const [leads, owners] = await Promise.all([
    prisma.lead.findMany({
      where: { ...ownerFilter, stage: { in: [...BOARD_STAGES] } },
      orderBy: { updatedAt: 'desc' },
      take: MAX_CARDS,
      include: {
        owner: { select: { name: true } },
        tasks: { where: { done: false }, orderBy: { dueAt: 'asc' }, take: 1 },
      },
    }),
    isAdmin
      ? prisma.user.findMany({
          where: { active: true },
          orderBy: { name: 'asc' },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ])

  const cards = leads.map((lead) => ({
    id: lead.id,
    company: lead.company,
    stage: lead.stage,
    priority: lead.priority,
    location: lead.location,
    industry: lead.industry,
    dealValue: lead.dealValue,
    potentials: safePotentials(lead.potentials).slice(0, 2),
    ownerName: lead.owner?.name ?? null,
    nextTaskTitle: lead.tasks[0]?.title ?? null,
    nextTaskDue: lead.tasks[0]?.dueAt.toISOString() ?? null,
    updatedAt: lead.updatedAt.toISOString(),
  }))

  return (
    <div className="flex flex-col gap-4 h-[calc(100dvh-9.5rem)] lg:h-[calc(100dvh-7rem)]">
      <PageHeader
        title="Pipeline"
        subtitle="Karten per Drag & Drop verschieben - auf dem Handy mit den Pfeilen."
        actions={
          <>
            {isAdmin ? (
              <form className="contents">
                <select
                  name="owner"
                  className="select w-auto"
                  defaultValue={owner ?? 'all'}
                  aria-label="Nach Mitarbeiter filtern"
                >
                  <option value="all">Ganzes Team</option>
                  <option value="me">Nur meine</option>
                  {owners.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn btn-secondary">
                  Filtern
                </button>
              </form>
            ) : null}
            <Link href="/leads/new" className="btn btn-primary">
              <IconPlus />
              Neuer Lead
            </Link>
          </>
        }
      />

      <div className="flex-1 min-h-0">
        <KanbanBoard cards={cards} showOwner={isAdmin} />
      </div>

      {leads.length === MAX_CARDS ? (
        <p className="subtle text-xs">
          Es werden die {MAX_CARDS} zuletzt bearbeiteten Leads angezeigt. Nutze die{' '}
          <Link href="/leads" className="link">
            Lead-Liste
          </Link>{' '}
          mit Filtern für den vollen Bestand.
        </p>
      ) : null}
    </div>
  )
}
