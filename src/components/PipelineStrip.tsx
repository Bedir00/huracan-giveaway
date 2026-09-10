import Link from 'next/link'
import { BOARD_STAGES, STAGE_SHORT, type Stage } from '@/lib/constants'
import { stageVar } from './ui'

/**
 * The pipeline as a single glanceable row: one segment per stage, width
 * proportional to the lead count. Each segment links into the filtered list.
 */
export function PipelineStrip({
  counts,
  lost,
}: {
  counts: { stage: Stage; count: number }[]
  lost?: number
}) {
  const board = counts.filter((c) => c.stage !== 'VERLOREN')
  const total = board.reduce((sum, c) => sum + c.count, 0)

  return (
    // A container query, not a viewport breakpoint: this strip sits both in the
    // narrow dashboard rail and in full-width cards, and the viewport says
    // nothing about which.
    <div className="@container">
      <div className="flex items-center gap-1 h-2 mb-3" role="img" aria-label="Pipeline-Verteilung">
        {total === 0 ? (
          <div className="flex-1 h-full rounded-full bg-[var(--surface-3)]" />
        ) : (
          board.map((entry) =>
            entry.count === 0 ? null : (
              <div
                key={entry.stage}
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(entry.count / total) * 100}%`,
                  minWidth: '4px',
                  background: stageVar(entry.stage),
                }}
                title={`${STAGE_SHORT[entry.stage]}: ${entry.count}`}
              />
            ),
          )
        )}
      </div>

      <div className="grid grid-cols-2 @md:grid-cols-4 gap-1.5">
        {BOARD_STAGES.map((stage) => {
          const count = board.find((c) => c.stage === stage)?.count ?? 0
          return (
            <Link
              key={stage}
              href={`/leads?stage=${stage}`}
              className="rounded-[10px] px-2 py-1.5 transition-colors hover:bg-[var(--surface-2)]"
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <i className="dot" style={{ color: stageVar(stage) }} aria-hidden="true" />
                <span className="text-[0.6875rem] subtle truncate">{STAGE_SHORT[stage]}</span>
              </span>
              <span className="block text-[0.9375rem] font-semibold tabular mt-0.5">{count}</span>
            </Link>
          )
        })}
      </div>

      {lost !== undefined && lost > 0 ? (
        <Link
          href="/leads?stage=VERLOREN"
          className="inline-flex items-center gap-1.5 mt-3 text-[0.6875rem] subtle hover:text-[var(--text)]"
        >
          <i className="dot" style={{ color: stageVar('VERLOREN') }} aria-hidden="true" />
          {lost} verloren / kein Interesse
        </Link>
      ) : null}
    </div>
  )
}
