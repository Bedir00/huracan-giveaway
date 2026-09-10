import Link from 'next/link'
import { FunnelChart } from '@/components/charts/FunnelChart'
import { TrendChart } from '@/components/charts/TrendChart'
import { Avatar, Card, CardHeader, EmptyState, Kpi, Meter, PageHeader } from '@/components/ui'
import { requireAdmin } from '@/lib/auth'
import { POTENTIAL_LABELS, SOURCE_LABELS } from '@/lib/constants'
import { addDays, startOfDay, startOfMonth } from '@/lib/dates'
import { prisma } from '@/lib/db'
import { fmtCurrency, fmtPercent, rate } from '@/lib/format'
import { safePotentials } from '@/lib/leadList'
import {
  getAdminKpis,
  getDailyTrend,
  getFunnel,
  getSourceBreakdown,
  getTeamPerformance,
} from '@/lib/stats'

export const metadata = { title: 'Analytics' }

const RANGES = [
  { key: '30', label: 'Letzte 30 Tage' },
  { key: 'month', label: 'Dieser Monat' },
  { key: '90', label: 'Letzte 90 Tage' },
  { key: 'all', label: 'Gesamt' },
] as const

function rangeStart(key: string): Date | undefined {
  switch (key) {
    case 'month':
      return startOfMonth()
    case '90':
      return startOfDay(addDays(new Date(), -90))
    case 'all':
      return undefined
    default:
      return startOfDay(addDays(new Date(), -30))
  }
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  await requireAdmin()
  const { range } = await searchParams
  const activeRange = RANGES.some((entry) => entry.key === range) ? range! : '30'
  const since = rangeStart(activeRange)

  const [kpis, funnel, sources, team, trend, potentialRows, lostReasons] = await Promise.all([
    getAdminKpis(since),
    getFunnel(since),
    getSourceBreakdown(since),
    getTeamPerformance(since),
    getDailyTrend(14),
    prisma.lead.findMany({
      where: since ? { createdAt: { gte: since } } : {},
      select: { potentials: true, stage: true },
    }),
    prisma.lead.findMany({
      where: { stage: 'VERLOREN', ...(since ? { lostAt: { gte: since } } : {}) },
      select: { lostReason: true },
      take: 500,
    }),
  ])

  // Which recognised potential shows up most - and how often it converts.
  const potentialStats = new Map<string, { total: number; won: number }>()
  for (const lead of potentialRows) {
    for (const key of safePotentials(lead.potentials)) {
      const entry = potentialStats.get(key) ?? { total: 0, won: 0 }
      entry.total += 1
      if (lead.stage === 'GEWONNEN') entry.won += 1
      potentialStats.set(key, entry)
    }
  }
  const potentials = [...potentialStats.entries()]
    .map(([key, value]) => ({ key, ...value, closeRate: rate(value.won, value.total) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)

  const reasonCounts = new Map<string, number>()
  for (const lead of lostReasons) {
    const reason = (lead.lostReason ?? 'Kein Grund angegeben').trim() || 'Kein Grund angegeben'
    reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1)
  }
  const reasons = [...reasonCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)

  const activeTeam = team.filter((row) => row.active)
  const maxTeamLeads = Math.max(1, ...activeTeam.map((row) => row.created))

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Analytics"
        subtitle="Was macht das Team und wie erfolgreich ist es?"
        actions={
          <Link href="/api/export/leads" className="btn btn-secondary" prefetch={false}>
            CSV-Export
          </Link>
        }
      />

      {/* Filters sit in one row above the charts. */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {RANGES.map((entry) => (
          <Link
            key={entry.key}
            href={`/analytics?range=${entry.key}`}
            className="chip-toggle"
            style={
              entry.key === activeRange
                ? {
                    background: 'var(--accent-soft)',
                    borderColor: 'var(--accent-border)',
                    color: 'var(--accent)',
                    fontWeight: 600,
                  }
                : undefined
            }
          >
            {entry.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Leads gesamt" value={kpis.total} hint={`${kpis.active} aktiv`} />
        <Kpi label="Neu im Zeitraum" value={kpis.newThisPeriod} />
        <Kpi label="Gewonnen" value={kpis.won} tone="success" hint={`${kpis.lost} verloren`} />
        <Kpi
          label="Umsatz"
          value={fmtCurrency(kpis.revenue)}
          hint={kpis.won ? `⌀ ${fmtCurrency(kpis.avgDeal)} pro Abschluss` : undefined}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <RateCard
          label="Kontaktquote"
          value={kpis.contactRate}
          hint={`${kpis.contacted} kontaktiert`}
        />
        <RateCard label="Antwortquote" value={kpis.replyRate} hint={`${kpis.replied} Antworten`} />
        <RateCard
          label="Terminquote"
          value={kpis.appointmentRate}
          hint={`${kpis.appointments} Termine`}
        />
        <RateCard label="Abschlussquote" value={kpis.closeRate} hint={`${kpis.won} Abschlüsse`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Funnel: Lead bis Kunde" hint="Weiteste erreichte Stufe je Lead" />
          <FunnelChart rows={funnel} />
        </Card>

        <Card>
          <CardHeader title="Aktivität" hint="Letzte 14 Tage" />
          <TrendChart
            points={trend.map((point) => ({
              date: point.date.toISOString(),
              created: point.created,
              won: point.won,
            }))}
          />
        </Card>
      </div>

      <Card padded={false}>
        <div className="card-pad pb-2">
          <CardHeader title="Lead-Quellen" hint="Welche Quelle bringt tatsächlich Abschlüsse" />
        </div>
        <div className="scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th>Quelle</th>
                <th className="table-num">Leads</th>
                <th className="table-num">Gewonnen</th>
                <th className="table-num">Quote</th>
                <th className="table-num">Umsatz</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((row) => (
                <tr key={row.source}>
                  <td className="font-medium">
                    <Link href={`/leads?source=${row.source}`} className="link">
                      {SOURCE_LABELS[row.source as keyof typeof SOURCE_LABELS] ?? row.source}
                    </Link>
                  </td>
                  <td className="table-num tabular">{row.total}</td>
                  <td className="table-num tabular">{row.won}</td>
                  <td className="table-num tabular">{fmtPercent(row.closeRate, 1)}</td>
                  <td className="table-num tabular">{fmtCurrency(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sources.length === 0 ? <EmptyState title="Noch keine Leads im Zeitraum" /> : null}
      </Card>

      <Card padded={false}>
        <div className="card-pad pb-2">
          <CardHeader title="Mitarbeiter im Vergleich" hint="Im gewählten Zeitraum" />
        </div>
        <div className="scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th>Mitarbeiter</th>
                <th className="table-num">Angelegt</th>
                <th className="table-num">Kontaktiert</th>
                <th className="table-num">Antworten</th>
                <th className="table-num">Termine</th>
                <th className="table-num">Abschlüsse</th>
                <th className="table-num">Umsatz</th>
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
                  <td className="table-num tabular">
                    <span className="flex items-center gap-2 justify-end">
                      <span
                        className="h-1.5 rounded-full hidden sm:block"
                        style={{
                          width: `${Math.max(3, (row.created / maxTeamLeads) * 56)}px`,
                          background: 'var(--chart-1)',
                        }}
                        aria-hidden="true"
                      />
                      {row.created}
                    </span>
                  </td>
                  <td className="table-num tabular">{row.contacted}</td>
                  <td className="table-num tabular">{row.replies}</td>
                  <td className="table-num tabular">{row.appointments}</td>
                  <td className="table-num tabular font-semibold">{row.won}</td>
                  <td className="table-num tabular">{fmtCurrency(row.revenue)}</td>
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
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Erkannte Potenziale" hint="Häufigkeit und Abschlussquote" />
          {potentials.length === 0 ? (
            <EmptyState title="Noch keine Potenziale erfasst" />
          ) : (
            <div className="flex flex-col gap-2.5">
              {potentials.map((entry) => (
                <div key={entry.key}>
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <span className="text-xs muted truncate">
                      {POTENTIAL_LABELS[entry.key] ?? entry.key}
                    </span>
                    <span className="text-xs tabular shrink-0">
                      <strong>{entry.total}</strong> · {fmtPercent(entry.closeRate)} gewonnen
                    </span>
                  </div>
                  <Meter value={(entry.total / potentials[0]!.total) * 100} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Verlustgründe" hint="Warum Leads verloren gehen" />
          {reasons.length === 0 ? (
            <EmptyState title="Keine verlorenen Leads im Zeitraum" />
          ) : (
            <div className="divide-row">
              {reasons.map(([reason, count]) => (
                <div key={reason} className="flex items-baseline justify-between gap-3 py-2">
                  <span className="text-[0.8125rem] min-w-0 truncate">{reason}</span>
                  <span className="text-xs tabular subtle shrink-0">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function RateCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="card card-pad">
      <span className="section-title">{label}</span>
      <div className="kpi mt-2">{fmtPercent(value, 1)}</div>
      <div className="mt-2">
        <Meter value={value} />
      </div>
      {hint ? <div className="subtle text-xs mt-1.5">{hint}</div> : null}
    </div>
  )
}
