'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { logActivity } from '@/app/actions/leads'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { Toast } from '@/components/ui'
import {
  ACTIVITY_ICONS,
  ACTIVITY_LABELS,
  type ActivityType,
  FOLLOWUP_SUGGESTIONS,
  LOGGABLE_ACTIVITY_TYPES,
  OUTCOME_LABELS,
  OUTCOMES,
} from '@/lib/constants'
import { toDateInput } from '@/lib/dates'

/**
 * Always-visible composer on the lead page: pick a type, write a line, done.
 * The follow-up fields ride along so the "next step" rule costs no extra form.
 */
export function ActivityComposer({ leadId }: { leadId: string }) {
  const [state, action, pending] = useActionState(logActivity, {})
  const [type, setType] = useState<ActivityType>('CALL')
  const [showFollowup, setShowFollowup] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok) setShowFollowup(false)
  }, [state.ok])

  const isContact = type !== 'NOTE' && type !== 'FOLLOWUP'

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <input type="hidden" name="leadId" value={leadId} />
      <input type="hidden" name="type" value={type} />
      <Toast state={state} />

      <div className="flex flex-wrap gap-1.5">
        {LOGGABLE_ACTIVITY_TYPES.map((option) => (
          <button
            key={option}
            type="button"
            className="chip-toggle"
            style={
              option === type
                ? {
                    background: 'var(--accent-soft)',
                    borderColor: 'var(--accent-border)',
                    color: 'var(--accent)',
                    fontWeight: 600,
                  }
                : undefined
            }
            onClick={() => setType(option)}
            aria-pressed={option === type}
          >
            <span aria-hidden="true">{ACTIVITY_ICONS[option]}</span>
            {ACTIVITY_LABELS[option]}
          </button>
        ))}
      </div>

      <textarea
        name="note"
        className="textarea"
        rows={2}
        placeholder={
          type === 'CALL' ? 'z. B. angerufen, nicht erreicht - Mailbox voll' : 'Was ist passiert?'
        }
      />

      {isContact ? (
        <div className="flex flex-wrap gap-1.5">
          {OUTCOMES.map((outcome) => (
            <label key={outcome} className="chip-toggle">
              <input type="radio" name="outcome" value={outcome} />
              {OUTCOME_LABELS[outcome]}
            </label>
          ))}
        </div>
      ) : null}

      {showFollowup ? (
        <div className="grid sm:grid-cols-[1fr_auto_auto] gap-2 animate-in">
          <input
            name="followupTitle"
            className="input"
            list="composer-followups"
            placeholder="Nächster Schritt"
          />
          <datalist id="composer-followups">
            {FOLLOWUP_SUGGESTIONS.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
          <input
            name="followupDate"
            type="date"
            className="input"
            defaultValue={toDateInput(new Date(Date.now() + 86_400_000))}
          />
          <input name="followupTime" type="time" className="input" />
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <SubmitButton pending={pending} className="btn btn-primary" pendingLabel="Speichern…">
          Dokumentieren
        </SubmitButton>
        <button type="button" className="btn btn-ghost" onClick={() => setShowFollowup((v) => !v)}>
          {showFollowup ? 'Ohne Follow-up' : '+ Nächster Schritt'}
        </button>
      </div>
    </form>
  )
}
