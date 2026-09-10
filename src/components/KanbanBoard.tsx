'use client'

import Link from 'next/link'
import { useOptimistic, useState, useTransition } from 'react'
import { moveLeadStage } from '@/app/actions/leads'
import { BOARD_STAGES, POTENTIAL_LABELS, STAGE_SHORT, type Stage } from '@/lib/constants'
import { fmtRelativeDay, startOfDay } from '@/lib/dates'
import { fmtCurrency } from '@/lib/format'
import { IconAlert, IconChevronRight, IconClock, IconGrip } from './icons'
import { Avatar, stageVar } from './ui'

export type BoardCard = {
  id: string
  company: string
  stage: string
  priority: string
  location: string | null
  industry: string | null
  dealValue: number | null
  potentials: string[]
  ownerName: string | null
  nextTaskTitle: string | null
  nextTaskDue: string | null
  updatedAt: string
}

/**
 * Kanban pipeline.
 *
 * Desktop uses native HTML5 drag & drop; the mobile fallback is a pair of
 * arrows on every card, because touch drag between horizontally scrolling
 * columns is a fight nobody wins. Moves are optimistic and roll back if the
 * server rejects them.
 */
export function KanbanBoard({ cards, showOwner }: { cards: BoardCard[]; showOwner: boolean }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [overStage, setOverStage] = useState<string | null>(null)

  const [optimisticCards, applyMove] = useOptimistic(
    cards,
    (state: BoardCard[], move: { id: string; stage: string }) =>
      state.map((card) => (card.id === move.id ? { ...card, stage: move.stage } : card)),
  )

  function move(id: string, stage: string) {
    const card = optimisticCards.find((c) => c.id === id)
    if (!card || card.stage === stage) return
    setError(null)
    startTransition(async () => {
      applyMove({ id, stage })
      const result = await moveLeadStage(id, stage)
      if (!result.ok) setError(result.error ?? 'Verschieben fehlgeschlagen.')
    })
  }

  return (
    <div className="flex flex-col gap-3 min-h-0">
      {error ? <p className="toast toast-error">{error}</p> : null}

      <div className="board" style={{ opacity: pending ? 0.85 : 1 }}>
        {BOARD_STAGES.map((stage) => {
          const columnCards = optimisticCards.filter((card) => card.stage === stage)
          const value = columnCards.reduce((sum, card) => sum + (card.dealValue ?? 0), 0)

          return (
            <section
              key={stage}
              className="board-col"
              data-over={overStage === stage}
              onDragOver={(event) => {
                event.preventDefault()
                setOverStage(stage)
              }}
              onDragLeave={() => setOverStage((current) => (current === stage ? null : current))}
              onDrop={(event) => {
                event.preventDefault()
                setOverStage(null)
                const id = event.dataTransfer.getData('text/plain') || dragging
                if (id) move(id, stage)
                setDragging(null)
              }}
            >
              <header className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border)]">
                <i className="dot" style={{ color: stageVar(stage) }} aria-hidden="true" />
                <h2 className="text-xs font-semibold">{STAGE_SHORT[stage]}</h2>
                <span className="nav-count ml-auto">{columnCards.length}</span>
              </header>

              {value > 0 ? (
                <p className="px-3 pt-2 subtle text-[0.6875rem] tabular">{fmtCurrency(value)}</p>
              ) : null}

              <div className="flex flex-col gap-2 p-2 overflow-y-auto flex-1 min-h-[4rem]">
                {columnCards.length === 0 ? (
                  <p className="subtle text-[0.6875rem] px-1 py-3 text-center">
                    Karte hierher ziehen
                  </p>
                ) : (
                  columnCards.map((card) => (
                    <BoardCardView
                      key={card.id}
                      card={card}
                      showOwner={showOwner}
                      dragging={dragging === card.id}
                      onDragStart={(event) => {
                        event.dataTransfer.setData('text/plain', card.id)
                        event.dataTransfer.effectAllowed = 'move'
                        setDragging(card.id)
                      }}
                      onDragEnd={() => setDragging(null)}
                      onStep={(direction) => {
                        const index = BOARD_STAGES.indexOf(card.stage as Stage)
                        const target = BOARD_STAGES[index + direction]
                        if (target) move(card.id, target)
                      }}
                    />
                  ))
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function BoardCardView({
  card,
  showOwner,
  dragging,
  onDragStart,
  onDragEnd,
  onStep,
}: {
  card: BoardCard
  showOwner: boolean
  dragging: boolean
  onDragStart: (event: React.DragEvent) => void
  onDragEnd: () => void
  onStep: (direction: -1 | 1) => void
}) {
  const due = card.nextTaskDue ? new Date(card.nextTaskDue) : null
  const overdue = due ? due < startOfDay() : false
  const index = BOARD_STAGES.indexOf(card.stage as Stage)

  return (
    <article
      className="board-card"
      draggable
      data-dragging={dragging}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-start gap-1.5">
        <span className="subtle text-xs mt-0.5 cursor-grab hidden sm:block" aria-hidden="true">
          <IconGrip />
        </span>
        <Link href={`/leads/${card.id}`} prefetch={false} className="min-w-0 flex-1">
          <h3 className="text-[0.8125rem] font-semibold leading-tight truncate">{card.company}</h3>
          {card.industry || card.location ? (
            <p className="subtle text-[0.6875rem] truncate">
              {[card.industry, card.location].filter(Boolean).join(' · ')}
            </p>
          ) : null}
        </Link>
        {card.priority === 'HOT' ? (
          <span title="Hot" aria-label="Hot">
            🔥
          </span>
        ) : null}
      </div>

      {card.potentials.length ? (
        <p className="subtle text-[0.6875rem] mt-1.5 truncate">
          {card.potentials.map((key) => POTENTIAL_LABELS[key] ?? key).join(' · ')}
        </p>
      ) : null}

      {card.nextTaskTitle && due ? (
        <p
          className="text-[0.6875rem] mt-1.5 flex items-center gap-1"
          style={{ color: overdue ? 'var(--danger)' : 'var(--text-muted)' }}
        >
          {overdue ? <IconAlert /> : <IconClock />}
          <span className="truncate">{card.nextTaskTitle}</span>
          <span className="shrink-0">· {fmtRelativeDay(due)}</span>
        </p>
      ) : (
        <p className="text-[0.6875rem] mt-1.5" style={{ color: 'var(--warning)' }}>
          Kein nächster Schritt
        </p>
      )}

      <div className="flex items-center gap-1 mt-2">
        {card.dealValue ? (
          <span className="badge badge-success">{fmtCurrency(card.dealValue)}</span>
        ) : null}
        {showOwner && card.ownerName ? <Avatar name={card.ownerName} /> : null}

        {/* Touch fallback for drag & drop. */}
        <div className="flex items-center gap-0.5 ml-auto sm:opacity-60">
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-icon"
            onClick={() => onStep(-1)}
            disabled={index <= 0}
            aria-label="Eine Stufe zurück"
            title="Eine Stufe zurück"
          >
            <IconChevronRight style={{ transform: 'rotate(180deg)' }} />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-icon"
            onClick={() => onStep(1)}
            disabled={index === BOARD_STAGES.length - 1}
            aria-label="Eine Stufe weiter"
            title="Eine Stufe weiter"
          >
            <IconChevronRight />
          </button>
        </div>
      </div>
    </article>
  )
}
