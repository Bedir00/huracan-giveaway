import Link from 'next/link'
import type { ReactNode } from 'react'
import { PRIORITY_LABELS, type Priority, STAGE_SHORT, type Stage } from '@/lib/constants'
import { avatarHue, initials } from '@/lib/format'

/** Maps a stage to its CSS variable so pills, bars and dots stay consistent. */
export function stageVar(stage: string): string {
  const map: Record<string, string> = {
    NEU: 'var(--stage-neu)',
    RECHERCHE: 'var(--stage-recherche)',
    KONTAKTIERT: 'var(--stage-kontaktiert)',
    ANTWORT: 'var(--stage-antwort)',
    INTERESSIERT: 'var(--stage-interessiert)',
    TERMIN: 'var(--stage-termin)',
    ANGEBOT: 'var(--stage-angebot)',
    GEWONNEN: 'var(--stage-gewonnen)',
    VERLOREN: 'var(--stage-verloren)',
  }
  return map[stage] ?? 'var(--text-muted)'
}

export function StagePill({ stage, className = '' }: { stage: string; className?: string }) {
  return (
    <span
      className={`stage-pill ${className}`}
      style={{ ['--stage-color' as string]: stageVar(stage) }}
    >
      <i className="dot" />
      {STAGE_SHORT[stage as Stage] ?? stage}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: string }) {
  const tone =
    priority === 'HOT' ? 'badge-danger' : priority === 'WARM' ? 'badge-warning' : 'badge-neutral'
  return (
    <span className={`badge ${tone}`}>
      {priority === 'HOT' ? '🔥' : priority === 'COLD' ? '❄️' : '☀️'}
      {PRIORITY_LABELS[priority as Priority] ?? priority}
    </span>
  )
}

export function Avatar({
  name,
  size = 'sm',
  title,
}: {
  name: string
  size?: 'sm' | 'lg'
  title?: string
}) {
  return (
    <span
      className={`avatar ${size === 'lg' ? 'avatar-lg' : ''}`}
      style={{ ['--avatar-hue' as string]: avatarHue(name) }}
      title={title ?? name}
    >
      {initials(name)}
    </span>
  )
}

export function Card({
  children,
  className = '',
  padded = true,
}: {
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return <div className={`card ${padded ? 'card-pad' : ''} ${className}`}>{children}</div>
}

export function CardHeader({
  title,
  action,
  hint,
}: {
  title: string
  action?: ReactNode
  hint?: string
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div>
        <h2 className="text-[0.9375rem] font-semibold">{title}</h2>
        {hint ? <p className="subtle text-xs mt-0.5">{hint}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-[1.375rem] font-semibold truncate">{title}</h1>
        {subtitle ? <p className="muted text-[0.8125rem] mt-1">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2 flex-wrap">{actions}</div> : null}
    </div>
  )
}

/** Compact metric tile used across all three dashboards. */
export function Kpi({
  label,
  value,
  hint,
  tone = 'default',
  href,
  icon,
}: {
  label: string
  value: string | number
  hint?: string
  tone?: 'default' | 'urgent' | 'success' | 'accent'
  href?: string
  icon?: ReactNode
}) {
  const color =
    tone === 'urgent'
      ? 'var(--danger)'
      : tone === 'success'
        ? 'var(--success)'
        : tone === 'accent'
          ? 'var(--accent)'
          : 'var(--text)'

  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="section-title">{label}</span>
        {icon ? <span className="subtle text-sm">{icon}</span> : null}
      </div>
      <div className="kpi mt-2" style={{ color }}>
        {value}
      </div>
      {hint ? <div className="subtle text-xs mt-1">{hint}</div> : null}
    </>
  )

  if (href) {
    return (
      <Link href={href} className="card card-pad card-hover block">
        {body}
      </Link>
    )
  }
  return <div className="card card-pad">{body}</div>
}

export function Meter({ value, color }: { value: number; color?: string }) {
  return (
    <div className="meter">
      <span
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color ?? undefined }}
      />
    </div>
  )
}

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string
  body?: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-6">
      {icon ? <div className="subtle text-2xl mb-3">{icon}</div> : null}
      <p className="font-medium">{title}</p>
      {body ? <p className="muted text-[0.8125rem] mt-1 max-w-sm">{body}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function Toast({
  state,
}: {
  state: { ok?: boolean; error?: string; message?: string } | null | undefined
}) {
  if (!state) return null
  if (state.error) {
    return (
      <p className="toast toast-error" role="alert">
        {state.error}
      </p>
    )
  }
  if (state.ok && state.message) {
    return (
      <p className="toast toast-success" role="status">
        {state.message}
      </p>
    )
  }
  return null
}

/** Horizontal stat row - label left, value right, used inside detail cards. */
export function DataRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="subtle text-xs shrink-0">{label}</span>
      <span className="text-[0.8125rem] text-right min-w-0 break-words">{children}</span>
    </div>
  )
}

export function Segmented({
  options,
  value,
  name,
}: {
  options: { value: string; label: string }[]
  value: string
  name: string
}) {
  return (
    <div className="inline-flex p-0.5 rounded-[10px] bg-[var(--surface-2)] border border-[var(--border)]">
      {options.map((option) => (
        <label
          key={option.value}
          className="px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors"
          style={
            option.value === value
              ? {
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  boxShadow: 'var(--shadow-sm)',
                }
              : { color: 'var(--text-muted)' }
          }
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            defaultChecked={option.value === value}
            className="sr-only"
          />
          {option.label}
        </label>
      ))}
    </div>
  )
}
