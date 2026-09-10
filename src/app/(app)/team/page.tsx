import Link from 'next/link'
import { Avatar, Card, EmptyState, Kpi, PageHeader } from '@/components/ui'
import { requireAdmin } from '@/lib/auth'
import { ROLE_LABELS, type Role } from '@/lib/constants'
import { fmtCurrency, fmtPercent } from '@/lib/format'
import { getTeamPerformance } from '@/lib/stats'
import { prisma } from '@/lib/db'
import { startOfMonth } from '@/lib/dates'
import {
  AddMemberButton,
  EditMemberButton,
  ReassignButton,
  ResetPasswordButton,
  type MemberData,
} from './TeamManager'

export const metadata = { title: 'Team' }

export default async function TeamPage() {
  await requireAdmin()

  const [users, performance, unassigned] = await Promise.all([
    prisma.user.findMany({ orderBy: [{ active: 'desc' }, { name: 'asc' }] }),
    getTeamPerformance(startOfMonth()),
    prisma.lead.count({ where: { ownerId: null } }),
  ])

  const members: MemberData[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
  }))
  const stats = new Map(performance.map((row) => [row.id, row]))
  const activeMembers = members.filter((member) => member.active)

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Team"
        subtitle="Zugänge, Rollen und Leistung der Akquise-Mitarbeiter."
        actions={<AddMemberButton />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Aktive Mitarbeiter" value={activeMembers.length} />
        <Kpi
          label="Admins"
          value={activeMembers.filter((member) => member.role === 'ADMIN').length}
        />
        <Kpi
          label="Leads ohne Zuweisung"
          value={unassigned}
          tone={unassigned > 0 ? 'urgent' : 'default'}
          href="/leads?owner=none"
        />
        <Kpi
          label="Überfällige Follow-ups"
          value={performance.reduce((sum, row) => sum + row.overdue, 0)}
          href="/tasks?filter=overdue&scope=team"
        />
      </div>

      <Card padded={false}>
        <div className="card-pad pb-2">
          <h2 className="text-[0.9375rem] font-semibold">Mitarbeiter</h2>
          <p className="subtle text-xs mt-0.5">Kennzahlen für den laufenden Monat.</p>
        </div>

        <div className="scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Rolle</th>
                <th className="table-num">Leads</th>
                <th className="table-num">Angelegt</th>
                <th className="table-num">Kontaktiert</th>
                <th className="table-num">Antworten</th>
                <th className="table-num">Termine</th>
                <th className="table-num">Abschlüsse</th>
                <th className="table-num hidden 2xl:table-cell">Umsatz</th>
                <th className="table-num">Offen</th>
                {/* Pinned so the actions stay reachable while the table scrolls. */}
                <th className="sticky right-0 bg-[var(--surface)]" />
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const row = stats.get(member.id)
                return (
                  <tr key={member.id} style={member.active ? undefined : { opacity: 0.55 }}>
                    <td>
                      <span className="flex items-center gap-2">
                        <Avatar name={member.name} />
                        <span className="min-w-0">
                          <span className="block font-medium truncate">{member.name}</span>
                          <span className="block subtle text-[0.6875rem] truncate">
                            {member.email}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${member.role === 'ADMIN' ? 'badge-accent' : 'badge-neutral'}`}
                      >
                        {ROLE_LABELS[member.role as Role]}
                      </span>
                      {!member.active ? (
                        <span className="badge badge-danger ml-1">inaktiv</span>
                      ) : null}
                    </td>
                    <td className="table-num tabular">
                      <Link href={`/leads?owner=${member.id}`} className="link">
                        {row?.leads ?? 0}
                      </Link>
                    </td>
                    <td className="table-num tabular">{row?.created ?? 0}</td>
                    <td className="table-num tabular">{row?.contacted ?? 0}</td>
                    <td className="table-num tabular">{row?.replies ?? 0}</td>
                    <td className="table-num tabular">{row?.appointments ?? 0}</td>
                    <td className="table-num tabular font-semibold">{row?.won ?? 0}</td>
                    <td className="table-num tabular hidden 2xl:table-cell">
                      {fmtCurrency(row?.revenue ?? 0)}
                    </td>
                    <td className="table-num tabular">
                      {row && row.overdue > 0 ? (
                        <span style={{ color: 'var(--danger)' }} title="überfällig">
                          {row.openTasks} ({row.overdue}!)
                        </span>
                      ) : (
                        (row?.openTasks ?? 0)
                      )}
                    </td>
                    <td className="sticky right-0 bg-[var(--surface)]">
                      <span className="flex items-center gap-0.5 justify-end">
                        <ReassignButton
                          member={member}
                          members={members}
                          leadCount={row?.leads ?? 0}
                        />
                        <ResetPasswordButton member={member} />
                        <EditMemberButton member={member} />
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {members.length === 0 ? <EmptyState title="Noch keine Mitarbeiter" /> : null}
      </Card>

      <Card>
        <h2 className="text-[0.9375rem] font-semibold mb-3">Abschlussquote im Vergleich</h2>
        <div className="flex flex-col gap-2.5">
          {performance
            .filter((row) => row.active && row.leads > 0)
            .sort((a, b) => b.closeRate - a.closeRate)
            .map((row) => (
              <div key={row.id}>
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-xs muted">{row.name}</span>
                  <span className="text-xs tabular">
                    <strong>{row.won}</strong> von {row.leads} · {fmtPercent(row.closeRate, 1)}
                  </span>
                </div>
                <div className="meter">
                  <span style={{ width: `${Math.min(100, row.closeRate)}%` }} />
                </div>
              </div>
            ))}
        </div>
        {performance.filter((row) => row.active && row.leads > 0).length === 0 ? (
          <p className="subtle text-xs">Noch keine Leads zugewiesen.</p>
        ) : null}
      </Card>
    </div>
  )
}
