import { STAGE_SHORT, type Stage } from '@/lib/constants'
import { fmtPercent } from '@/lib/format'

export type FunnelRow = { stage: Stage; count: number; share: number }

/**
 * Lead-to-customer funnel.
 *
 * One series, so no legend box: horizontal bars with the count at the tip and
 * the step-to-step conversion beside it. Built on the high-water stage, so a
 * lead that was later lost still counts for the steps it actually passed.
 */
export function FunnelChart({ rows }: { rows: FunnelRow[] }) {
  const top = Math.max(1, rows[0]?.count ?? 1)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5 subtle text-[0.625rem]">
        <span className="w-[6.5rem] shrink-0">Stufe</span>
        <span className="flex-1" />
        <span className="w-10 text-right shrink-0">Leads</span>
        <span className="w-14 text-right shrink-0">Übergang</span>
      </div>

      {rows.map((row, index) => {
        const previous = rows[index - 1]
        const stepRate = previous && previous.count ? (row.count / previous.count) * 100 : null

        return (
          <div key={row.stage} className="flex items-center gap-2.5">
            <span className="text-[0.6875rem] muted w-[6.5rem] shrink-0 truncate">
              {STAGE_SHORT[row.stage]}
            </span>

            <div className="flex-1">
              <div
                className="h-5 rounded-r-[4px] transition-all"
                style={{
                  // A zero step gets no bar at all - a stub would read as "some".
                  width: row.count === 0 ? '0%' : `${Math.max(1.5, (row.count / top) * 100)}%`,
                  background: 'var(--chart-1)',
                }}
              />
            </div>

            <span className="text-[0.6875rem] tabular w-10 text-right shrink-0 font-semibold">
              {row.count}
            </span>
            <span className="text-[0.6875rem] tabular w-14 text-right shrink-0 subtle">
              {stepRate === null ? fmtPercent(100) : fmtPercent(stepRate)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
