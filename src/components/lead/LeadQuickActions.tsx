'use client'

import { useActionState, useEffect, useState } from 'react'
import { changeStage, logActivity } from '@/app/actions/leads'
import { saveTask } from '@/app/actions/tasks'
import {
  IconCalendar,
  IconMail,
  IconNote,
  IconPhone,
  IconWhatsapp,
  IconArrowRight,
} from '@/components/icons'
import { Sheet } from '@/components/Sheet'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { StagePill, Toast } from '@/components/ui'
import {
  ACTIVITY_LABELS,
  type ActivityType,
  FOLLOWUP_SUGGESTIONS,
  LOGGABLE_ACTIVITY_TYPES,
  OUTCOME_LABELS,
  OUTCOMES,
  STAGE_LABELS,
  STAGES,
} from '@/lib/constants'
import { toDateInput } from '@/lib/dates'
import { mailtoHref } from './helpers'

export type QuickLead = {
  id: string
  company: string
  stage: string
  phone: string | null
  email: string | null
  telHref: string | null
  whatsappHref: string | null
}

type SheetKind =
  null | { mode: 'activity'; type: ActivityType } | { mode: 'followup' } | { mode: 'stage' }

/**
 * The six actions from the briefing: call, WhatsApp, e-mail, note, follow-up,
 * change status.
 *
 * Tapping call/WhatsApp/e-mail opens the channel *and* the documentation sheet
 * prefilled with that activity type - so logging the attempt costs one extra
 * tap instead of a trip to a form.
 */
export function LeadQuickActions({
  lead,
  compact = false,
}: {
  lead: QuickLead
  compact?: boolean
}) {
  const [sheet, setSheet] = useState<SheetKind>(null)
  const mailto = mailtoHref(lead.email)

  function openChannel(href: string | null, type: ActivityType, newTab = false) {
    if (href) {
      if (newTab) window.open(href, '_blank', 'noopener')
      else window.location.href = href
    }
    setSheet({ mode: 'activity', type })
  }

  const size = compact ? 'btn-sm' : ''

  return (
    <>
      <div className="flex items-center gap-1 flex-wrap">
        <button
          type="button"
          className={`btn btn-secondary ${size}`}
          onClick={() => openChannel(lead.telHref, 'CALL')}
          disabled={!lead.telHref}
          title={lead.telHref ? `Anrufen: ${lead.phone}` : 'Keine Telefonnummer hinterlegt'}
        >
          <IconPhone />
          <span className={compact ? 'sr-only sm:not-sr-only' : ''}>Anrufen</span>
        </button>

        <button
          type="button"
          className={`btn btn-secondary ${size}`}
          onClick={() => openChannel(lead.whatsappHref, 'WHATSAPP', true)}
          disabled={!lead.whatsappHref}
          title={lead.whatsappHref ? 'WhatsApp öffnen' : 'Keine Telefonnummer hinterlegt'}
        >
          <IconWhatsapp />
          <span className={compact ? 'sr-only sm:not-sr-only' : ''}>WhatsApp</span>
        </button>

        <button
          type="button"
          className={`btn btn-secondary ${size}`}
          onClick={() => openChannel(mailto, 'EMAIL')}
          disabled={!mailto}
          title={mailto ? `E-Mail an ${lead.email}` : 'Keine E-Mail hinterlegt'}
        >
          <IconMail />
          <span className={compact ? 'sr-only sm:not-sr-only' : ''}>E-Mail</span>
        </button>

        <button
          type="button"
          className={`btn btn-secondary ${size}`}
          onClick={() => setSheet({ mode: 'activity', type: 'NOTE' })}
        >
          <IconNote />
          <span className={compact ? 'sr-only sm:not-sr-only' : ''}>Notiz</span>
        </button>

        <button
          type="button"
          className={`btn btn-secondary ${size}`}
          onClick={() => setSheet({ mode: 'followup' })}
        >
          <IconCalendar />
          <span className={compact ? 'sr-only sm:not-sr-only' : ''}>Follow-up</span>
        </button>

        <button
          type="button"
          className={`btn btn-secondary ${size}`}
          onClick={() => setSheet({ mode: 'stage' })}
        >
          <IconArrowRight />
          <span className={compact ? 'sr-only sm:not-sr-only' : ''}>Status</span>
        </button>
      </div>

      {sheet?.mode === 'activity' ? (
        <ActivitySheet lead={lead} initialType={sheet.type} onClose={() => setSheet(null)} />
      ) : null}

      {sheet?.mode === 'followup' ? (
        <FollowupSheet lead={lead} onClose={() => setSheet(null)} />
      ) : null}

      {sheet?.mode === 'stage' ? <StageSheet lead={lead} onClose={() => setSheet(null)} /> : null}
    </>
  )
}

function ActivitySheet({
  lead,
  initialType,
  onClose,
}: {
  lead: QuickLead
  initialType: ActivityType
  onClose: () => void
}) {
  const [state, action, pending] = useActionState(logActivity, {})
  const [withFollowup, setWithFollowup] = useState(true)
  const [type, setType] = useState<ActivityType>(initialType)

  // Close as soon as the action reports success.
  useEffect(() => {
    if (state.ok) onClose()
  }, [state.ok, onClose])

  return (
    <Sheet
      open
      onClose={onClose}
      title={`${ACTIVITY_LABELS[type]} dokumentieren`}
      description={lead.company}
    >
      <form action={action} className="flex flex-col gap-3.5">
        <input type="hidden" name="leadId" value={lead.id} />
        <Toast state={state} />

        <div className="field">
          <label className="label" htmlFor="qa-type">
            Art
          </label>
          <select
            id="qa-type"
            name="type"
            className="select"
            value={type}
            onChange={(event) => setType(event.target.value as ActivityType)}
          >
            {LOGGABLE_ACTIVITY_TYPES.map((option) => (
              <option key={option} value={option}>
                {ACTIVITY_LABELS[option]}
              </option>
            ))}
          </select>
        </div>

        {/* A note or a planned follow-up has no contact outcome. */}
        {type !== 'NOTE' && type !== 'FOLLOWUP' ? (
          <div className="field">
            <span className="label">Ergebnis</span>
            <div className="flex flex-wrap gap-1.5">
              {OUTCOMES.map((outcome) => (
                <label key={outcome} className="chip-toggle">
                  <input type="radio" name="outcome" value={outcome} />
                  {OUTCOME_LABELS[outcome]}
                </label>
              ))}
            </div>
            <p className="hint">
              „hat geantwortet“ setzt den Lead automatisch auf „Antwort erhalten“.
            </p>
          </div>
        ) : null}

        <div className="field">
          <label className="label" htmlFor="qa-note">
            Notiz
          </label>
          <textarea
            id="qa-note"
            name="note"
            className="textarea"
            rows={3}
            placeholder="Kurz festhalten, was passiert ist…"
            autoFocus
          />
        </div>

        <div className="border-t border-[var(--border)] pt-3">
          <label className="flex items-center gap-2 text-[0.8125rem] font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={withFollowup}
              onChange={(event) => setWithFollowup(event.target.checked)}
            />
            Nächsten Schritt festlegen
          </label>

          {withFollowup ? (
            <div className="mt-3 flex flex-col gap-3">
              <div className="field">
                <label className="label" htmlFor="qa-fu-title">
                  Aufgabe
                </label>
                <input
                  id="qa-fu-title"
                  name="followupTitle"
                  className="input"
                  list="followup-suggestions"
                  placeholder="z. B. morgen erneut anrufen"
                />
                <datalist id="followup-suggestions">
                  {FOLLOWUP_SUGGESTIONS.map((suggestion) => (
                    <option key={suggestion} value={suggestion} />
                  ))}
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="field">
                  <label className="label" htmlFor="qa-fu-date">
                    Datum
                  </label>
                  <input
                    id="qa-fu-date"
                    name="followupDate"
                    type="date"
                    className="input"
                    defaultValue={toDateInput(new Date(Date.now() + 86_400_000))}
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="qa-fu-time">
                    Uhrzeit
                  </label>
                  <input id="qa-fu-time" name="followupTime" type="time" className="input" />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex gap-2 pt-1">
          <SubmitButton
            pending={pending}
            className="btn btn-primary flex-1"
            pendingLabel="Speichern…"
          >
            Speichern
          </SubmitButton>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
        </div>
      </form>
    </Sheet>
  )
}

function FollowupSheet({ lead, onClose }: { lead: QuickLead; onClose: () => void }) {
  const [state, action, pending] = useActionState(saveTask, {})

  useEffect(() => {
    if (state.ok) onClose()
  }, [state.ok, onClose])

  return (
    <Sheet open onClose={onClose} title="Follow-up festlegen" description={lead.company}>
      <form action={action} className="flex flex-col gap-3.5">
        <input type="hidden" name="leadId" value={lead.id} />
        <Toast state={state} />

        <div className="field">
          <label className="label" htmlFor="fu-title">
            Nächster Schritt
          </label>
          <input
            id="fu-title"
            name="title"
            className="input"
            required
            autoFocus
            list="followup-suggestions-2"
            placeholder="z. B. Angebot nachfassen"
          />
          <datalist id="followup-suggestions-2">
            {FOLLOWUP_SUGGESTIONS.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {FOLLOWUP_SUGGESTIONS.slice(0, 4).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="chip-toggle"
                onClick={(event) => {
                  const input = event.currentTarget.form?.elements.namedItem(
                    'title',
                  ) as HTMLInputElement | null
                  if (input) input.value = suggestion
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="field">
            <label className="label" htmlFor="fu-date">
              Datum
            </label>
            <input
              id="fu-date"
              name="dueDate"
              type="date"
              className="input"
              required
              defaultValue={toDateInput(new Date(Date.now() + 86_400_000))}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="fu-time">
              Uhrzeit
            </label>
            <input id="fu-time" name="dueTime" type="time" className="input" />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <SubmitButton
            pending={pending}
            className="btn btn-primary flex-1"
            pendingLabel="Speichern…"
          >
            Follow-up speichern
          </SubmitButton>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
        </div>
      </form>
    </Sheet>
  )
}

function StageSheet({ lead, onClose }: { lead: QuickLead; onClose: () => void }) {
  const [state, action, pending] = useActionState(changeStage, {})
  const [stage, setStage] = useState(lead.stage)

  useEffect(() => {
    if (state.ok) onClose()
  }, [state.ok, onClose])

  return (
    <Sheet open onClose={onClose} title="Status ändern" description={lead.company}>
      <form action={action} className="flex flex-col gap-3.5">
        <input type="hidden" name="leadId" value={lead.id} />
        <Toast state={state} />

        <div className="flex flex-col gap-1">
          {STAGES.map((option) => (
            <label
              key={option}
              className="flex items-center gap-2.5 px-2 py-2 rounded-[10px] cursor-pointer transition-colors"
              style={option === stage ? { background: 'var(--surface-2)' } : undefined}
            >
              <input
                type="radio"
                name="stage"
                value={option}
                checked={option === stage}
                onChange={() => setStage(option)}
              />
              <StagePill stage={option} />
              <span className="text-[0.8125rem]">{STAGE_LABELS[option]}</span>
            </label>
          ))}
        </div>

        {stage === 'GEWONNEN' ? (
          <div className="field">
            <label className="label" htmlFor="stage-deal">
              Auftragswert (€)
            </label>
            <input
              id="stage-deal"
              name="dealValue"
              className="input"
              inputMode="decimal"
              placeholder="z. B. 2500"
            />
          </div>
        ) : null}

        {stage === 'VERLOREN' ? (
          <div className="field">
            <label className="label" htmlFor="stage-lost">
              Grund
            </label>
            <input
              id="stage-lost"
              name="lostReason"
              className="input"
              placeholder="z. B. kein Budget, arbeitet mit Agentur"
            />
          </div>
        ) : null}

        <div className="flex gap-2 pt-1">
          <SubmitButton
            pending={pending}
            className="btn btn-primary flex-1"
            pendingLabel="Speichern…"
          >
            Status setzen
          </SubmitButton>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
        </div>
      </form>
    </Sheet>
  )
}
