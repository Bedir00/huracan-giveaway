import Link from 'next/link'
import { POTENTIAL_LABELS, SOURCE_LABELS } from '@/lib/constants'
import { fmtRelativeDay, fmtTime, startOfDay } from '@/lib/dates'
import { fmtCurrency } from '@/lib/format'
import type { LeadCardData } from '@/lib/leadList'
import { IconAlert, IconChevronRight, IconClock } from '@/components/icons'
import { Avatar, PriorityBadge, StagePill } from '@/components/ui'
import { LeadQuickActions } from './LeadQuickActions'

/**
 * Mobile-first lead card. Everything an employee needs to decide "call this
 * one now or not" fits above the action row: company, status, priority, next
 * step and how overdue it is.
 */
export function LeadCard({ lead, showOwner = false }: { lead: LeadCardData; showOwner?: boolean }) {
  const overdue = lead.nextTask ? lead.nextTask.dueAt < startOfDay() : false
  const meta = [lead.industry, lead.location].filter(Boolean).join(' · ')

  return (
    <article className="card card-hover overflow-hidden animate-in">
      <div
        className="stage-bar"
        style={{ ['--stage-color' as string]: `var(--stage-${lead.stage.toLowerCase()})` }}
      />
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/leads/${lead.id}`} prefetch={false} className="min-w-0 group">
            <h3 className="font-semibold text-[0.9375rem] leading-tight truncate group-hover:text-[var(--accent)] transition-colors">
              {lead.company}
            </h3>
            {meta ? <p className="subtle text-xs mt-0.5 truncate">{meta}</p> : null}
          </Link>
          <Link
            href={`/leads/${lead.id}`}
            prefetch={false}
            className="btn btn-ghost btn-icon btn-sm shrink-0"
            aria-label={`${lead.company} öffnen`}
          >
            <IconChevronRight />
          </Link>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
          <StagePill stage={lead.stage} />
          <PriorityBadge priority={lead.priority} />
          {lead.dealValue ? (
            <span className="badge badge-success">{fmtCurrency(lead.dealValue)}</span>
          ) : null}
          {showOwner && lead.ownerName ? (
            <span className="inline-flex items-center gap-1.5 ml-auto">
              <Avatar name={lead.ownerName} />
              <span className="text-[0.6875rem] subtle hidden sm:inline">{lead.ownerName}</span>
            </span>
          ) : null}
          {showOwner && !lead.ownerName ? (
            <span className="badge badge-warning ml-auto">Nicht zugewiesen</span>
          ) : null}
        </div>

        {lead.potentials.length ? (
          <div className="flex items-center gap-1 flex-wrap mt-2">
            {lead.potentials.slice(0, 2).map((key) => (
              <span key={key} className="badge badge-neutral">
                {POTENTIAL_LABELS[key] ?? key}
              </span>
            ))}
            {lead.potentials.length > 2 ? (
              <span className="text-[0.6875rem] subtle">+{lead.potentials.length - 2}</span>
            ) : null}
          </div>
        ) : null}

        {/* The next step is the point of the whole tool - never hide it. */}
        <div className="mt-3 pt-3 border-t border-[var(--border)] text-xs">
          {lead.nextTask ? (
            <span
              className="inline-flex items-center gap-1.5"
              style={{ color: overdue ? 'var(--danger)' : 'var(--text-muted)' }}
            >
              {overdue ? <IconAlert /> : <IconClock />}
              <span className="font-medium">{lead.nextTask.title}</span>
              <span className="subtle" style={overdue ? { color: 'var(--danger)' } : undefined}>
                · {fmtRelativeDay(lead.nextTask.dueAt)}
                {lead.nextTask.hasTime ? `, ${fmtTime(lead.nextTask.dueAt)}` : ''}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 badge badge-warning">
              Kein nächster Schritt
            </span>
          )}
        </div>

        <div className="mt-3">
          <LeadQuickActions
            compact
            lead={{
              id: lead.id,
              company: lead.company,
              stage: lead.stage,
              phone: lead.phone,
              email: lead.email,
              telHref: lead.telHref,
              whatsappHref: lead.whatsappHref,
            }}
          />
        </div>

        <p className="subtle text-[0.6875rem] mt-2.5">
          {SOURCE_LABELS[lead.source as keyof typeof SOURCE_LABELS] ?? lead.source}
          {lead.contactName ? ` · ${lead.contactName}` : ''}
          {lead.lastContactAt ? ` · Kontakt ${fmtRelativeDay(lead.lastContactAt)}` : ''}
        </p>
      </div>
    </article>
  )
}
