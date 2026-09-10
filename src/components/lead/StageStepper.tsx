'use client'

import { useActionState, useEffect, useState } from 'react'
import { changeStage } from '@/app/actions/leads'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { Sheet } from '@/components/Sheet'
import { stageVar, Toast } from '@/components/ui'
import { BOARD_STAGES, STAGE_LABELS, STAGE_SHORT } from '@/lib/constants'
import { stageIndex } from '@/lib/stage'

/**
 * The pipeline as a clickable stepper.
 *
 * Advancing a lead is one tap. Won and lost need a number or a reason, so
 * those two open a small sheet instead of firing straight away.
 */
export function StageStepper({
  leadId,
  stage,
  dealValue,
}: {
  leadId: string
  stage: string
  dealValue: number | null
}) {
  const [state, action, pending] = useActionState(changeStage, {})
  const [closing, setClosing] = useState<null | 'GEWONNEN' | 'VERLOREN'>(null)
  const current = stageIndex(stage)
  const isLost = stage === 'VERLOREN'

  return (
    <div className="flex flex-col gap-3">
      <Toast state={state.error ? state : null} />

      <div className="scroll-x -mx-1 px-1">
        <div className="flex items-stretch gap-1 min-w-max">
          {BOARD_STAGES.map((option, index) => {
            const reached = !isLost && current >= index
            const isCurrent = stage === option
            const color = stageVar(option)

            if (option === 'GEWONNEN') {
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setClosing('GEWONNEN')}
                  className="flex flex-col gap-1 px-2.5 py-1.5 rounded-[10px] transition-colors min-w-[5.5rem]"
                  style={{
                    background: isCurrent
                      ? 'color-mix(in srgb, var(--success) 12%, transparent)'
                      : 'transparent',
                  }}
                >
                  <span
                    className="stage-bar w-full"
                    style={{
                      ['--stage-color' as string]: reached ? color : 'var(--border-strong)',
                    }}
                  />
                  <span
                    className="text-[0.6875rem] font-semibold text-left"
                    style={{ color: isCurrent ? 'var(--success)' : 'var(--text-muted)' }}
                  >
                    {STAGE_SHORT[option]}
                  </span>
                </button>
              )
            }

            return (
              <form key={option} action={action}>
                <input type="hidden" name="leadId" value={leadId} />
                <input type="hidden" name="stage" value={option} />
                <SubmitButton
                  pending={pending}
                  className="flex flex-col gap-1 px-2.5 py-1.5 rounded-[10px] transition-colors min-w-[5.5rem] w-full disabled:opacity-60"
                  title={`Auf „${STAGE_LABELS[option]}“ setzen`}
                >
                  <span
                    className="stage-bar w-full block"
                    style={{
                      ['--stage-color' as string]: reached ? color : 'var(--border-strong)',
                    }}
                  />
                  <span
                    className="text-[0.6875rem] font-semibold text-left block"
                    style={{ color: isCurrent ? color : 'var(--text-muted)' }}
                  >
                    {STAGE_SHORT[option]}
                  </span>
                </SubmitButton>
              </form>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="subtle text-xs">
          Aktuell:{' '}
          <strong style={{ color: stageVar(stage) }}>{STAGE_LABELS[stage as never]}</strong>
        </span>
        <button
          type="button"
          className="btn btn-danger btn-sm ml-auto"
          onClick={() => setClosing('VERLOREN')}
        >
          Als verloren markieren
        </button>
      </div>

      {closing ? (
        <CloseSheet
          leadId={leadId}
          mode={closing}
          dealValue={dealValue}
          onClose={() => setClosing(null)}
        />
      ) : null}
    </div>
  )
}

function CloseSheet({
  leadId,
  mode,
  dealValue,
  onClose,
}: {
  leadId: string
  mode: 'GEWONNEN' | 'VERLOREN'
  dealValue: number | null
  onClose: () => void
}) {
  const [state, action, pending] = useActionState(changeStage, {})

  useEffect(() => {
    if (state.ok) onClose()
  }, [state.ok, onClose])

  const won = mode === 'GEWONNEN'

  return (
    <Sheet
      open
      onClose={onClose}
      title={won ? 'Lead als gewonnen markieren' : 'Lead als verloren markieren'}
      description={
        won
          ? 'Der Auftragswert fließt in Umsatz und Auswertung ein.'
          : 'Der Grund hilft später bei der Analyse - der Lead bleibt erhalten.'
      }
    >
      <form action={action} className="flex flex-col gap-3.5">
        <input type="hidden" name="leadId" value={leadId} />
        <input type="hidden" name="stage" value={mode} />
        <Toast state={state} />

        {won ? (
          <div className="field">
            <label className="label" htmlFor="close-value">
              Auftragswert (€)
            </label>
            <input
              id="close-value"
              name="dealValue"
              className="input"
              inputMode="decimal"
              autoFocus
              defaultValue={dealValue ? String(dealValue) : ''}
              placeholder="z. B. 2500"
            />
          </div>
        ) : (
          <div className="field">
            <label className="label" htmlFor="close-reason">
              Grund
            </label>
            <input
              id="close-reason"
              name="lostReason"
              className="input"
              autoFocus
              placeholder="z. B. kein Budget, arbeitet mit Agentur, kein Interesse"
            />
          </div>
        )}

        <div className="flex gap-2">
          <SubmitButton
            pending={pending}
            className={`btn flex-1 ${won ? 'btn-primary' : 'btn-danger'}`}
            pendingLabel="Speichern…"
          >
            {won ? 'Gewonnen' : 'Verloren'}
          </SubmitButton>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
        </div>
      </form>
    </Sheet>
  )
}
