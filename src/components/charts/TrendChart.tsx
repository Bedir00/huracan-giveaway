'use client'

import { useState } from 'react'
import { fmtDate, fmtWeekday } from '@/lib/dates'

export type TrendPoint = { date: string; created: number; won: number }

const SERIES = [
  { key: 'created' as const, label: 'Neue Leads', color: 'var(--chart-1)' },
  { key: 'won' as const, label: 'Gewonnen', color: 'var(--chart-2)' },
]

/**
 * New vs. won leads per day.
 *
 * Grouped columns rather than a dual axis: both series are lead counts on the
 * same scale, so one axis is the honest encoding. Columns are capped, the two
 * bars of a day are separated by a surface gap, and every day carries a hover
 * tooltip - printing a number on each mark would be noise at 14 days wide.
 */
export function TrendChart({ points }: { points: TrendPoint[] }) {
  const [hover, setHover] = useState<number | null>(null)

  const max = Math.max(1, ...points.flatMap((point) => [point.created, point.won]))
  const ticks = niceTicks(max)
  const top = ticks[ticks.length - 1]!

  const height = 168
  const padTop = 8
  const padBottom = 14
  const plot = height - padTop - padBottom
  const slot = 100 / Math.max(1, points.length)
  const barWidth = Math.min(11, slot * 0.32)

  const active = hover === null ? null : points[hover]

  return (
    <div className="relative">
      {/* Two series, so the legend is always present. */}
      <div className="flex items-center gap-3 mb-2">
        {SERIES.map((series) => (
          <span key={series.key} className="flex items-center gap-1.5 text-[0.6875rem] muted">
            <span
              className="w-2.5 h-2.5 rounded-[3px]"
              style={{ background: series.color }}
              aria-hidden="true"
            />
            {series.label}
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        {/* Axis ticks carry the values the marks deliberately do not label. */}
        <div
          className="flex flex-col justify-between subtle text-[0.625rem] tabular shrink-0 text-right w-6"
          style={{ height, paddingTop: padTop - 5, paddingBottom: padBottom - 5 }}
        >
          {[...ticks].reverse().map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>

        <svg
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
          className="w-full"
          style={{ height }}
          role="img"
          aria-label="Neue und gewonnene Leads pro Tag"
        >
          {ticks.map((tick) => {
            const y = padTop + plot - (tick / top) * plot
            return (
              <line
                key={tick}
                x1="0"
                x2="100"
                y1={y}
                y2={y}
                stroke="var(--chart-grid)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            )
          })}

          {points.map((point, index) => {
            const center = slot * index + slot / 2
            return (
              <g
                key={point.date}
                onMouseEnter={() => setHover(index)}
                onMouseLeave={() => setHover(null)}
              >
                {/* Hit target spans the whole day slot, not just the marks. */}
                <rect
                  x={slot * index}
                  y={0}
                  width={slot}
                  height={height}
                  fill={hover === index ? 'var(--surface-2)' : 'transparent'}
                />
                {SERIES.map((series, seriesIndex) => {
                  const value = point[series.key]
                  if (!value) return null
                  const barHeight = (value / top) * plot
                  // 2px surface gap between the two bars of one day.
                  const offset = seriesIndex === 0 ? -barWidth / 2 - 1 : barWidth / 2 + 1
                  return (
                    <RoundedColumn
                      key={series.key}
                      x={center + offset - barWidth / 2}
                      width={barWidth}
                      y={padTop + plot - barHeight}
                      height={barHeight}
                      fill={series.color}
                    />
                  )
                })}
              </g>
            )
          })}

          <line
            x1="0"
            x2="100"
            y1={padTop + plot}
            y2={padTop + plot}
            stroke="var(--border-strong)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      <div className="flex ml-8">
        {points.map((point, index) => (
          <span
            key={point.date}
            className="flex-1 text-center subtle text-[0.5625rem] leading-tight"
            style={index % 2 === 1 ? { visibility: 'hidden' } : undefined}
          >
            {fmtWeekday(point.date)}
          </span>
        ))}
      </div>

      {active ? (
        <div className="popover absolute top-0 right-0 px-2.5 py-2 pointer-events-none">
          <p className="text-[0.6875rem] font-semibold">{fmtDate(active.date)}</p>
          {SERIES.map((series) => (
            <p key={series.key} className="text-[0.6875rem] muted flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-[2px]"
                style={{ background: series.color }}
                aria-hidden="true"
              />
              {series.label}: <strong className="tabular">{active[series.key]}</strong>
            </p>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/** Column with a rounded cap and a square foot on the baseline. */
function RoundedColumn({
  x,
  y,
  width,
  height,
  fill,
}: {
  x: number
  y: number
  width: number
  height: number
  fill: string
}) {
  const r = Math.min(2, width / 2, height)
  return (
    <path
      d={`M ${x} ${y + height} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} L ${x + width - r} ${y} Q ${x + width} ${y} ${x + width} ${y + r} L ${x + width} ${y + height} Z`}
      fill={fill}
    />
  )
}

/** Three clean ticks (0 / mid / top) rounded up to a readable step. */
function niceTicks(max: number): number[] {
  const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000]
  const step = steps.find((candidate) => candidate * 2 >= max) ?? Math.ceil(max / 2)
  return [0, step, step * 2]
}
