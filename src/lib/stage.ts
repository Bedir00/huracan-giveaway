import { BOARD_STAGES, type Stage } from './constants'

/** Position in the pipeline; "Verloren" sits outside the order. */
export function stageIndex(stage: string): number {
  const index = BOARD_STAGES.indexOf(stage as Stage)
  return index === -1 ? -1 : index
}

export function stageReached(maxStage: string, target: Stage): boolean {
  return stageIndex(maxStage) >= stageIndex(target)
}

export type StageProgress = {
  stage: string
  maxStage?: string
  firstContactAt?: Date
  firstReplyAt?: Date
  firstAppointmentAt?: Date
  firstOfferAt?: Date
  wonAt?: Date | null
  lostAt?: Date | null
  appointmentSetById?: string
  closedById?: string
}

type Current = {
  maxStage: string
  firstContactAt: Date | null
  firstReplyAt: Date | null
  firstAppointmentAt: Date | null
  firstOfferAt: Date | null
  appointmentSetById: string | null
  closedById: string | null
}

/**
 * Computes the field updates for a stage change.
 *
 * Besides the new stage this advances the funnel high-water mark and stamps
 * the "first time this lead reached X" timestamps. It also records who booked
 * the appointment and who closed the deal - the basis for a later commission
 * model.
 */
export function stageProgress(
  current: Current,
  nextStage: string,
  actorId: string,
  now: Date = new Date(),
): StageProgress {
  const update: StageProgress = { stage: nextStage }

  if (nextStage === 'VERLOREN') {
    update.lostAt = now
    update.wonAt = null
    return update
  }

  update.lostAt = null
  if (stageIndex(nextStage) > stageIndex(current.maxStage)) update.maxStage = nextStage

  const reaches = (target: Stage) => stageIndex(nextStage) >= stageIndex(target)

  if (reaches('KONTAKTIERT') && !current.firstContactAt) update.firstContactAt = now
  if (reaches('ANTWORT') && !current.firstReplyAt) update.firstReplyAt = now
  if (reaches('TERMIN') && !current.firstAppointmentAt) {
    update.firstAppointmentAt = now
    if (!current.appointmentSetById) update.appointmentSetById = actorId
  }
  if (reaches('ANGEBOT') && !current.firstOfferAt) update.firstOfferAt = now

  if (nextStage === 'GEWONNEN') {
    update.wonAt = now
    if (!current.closedById) update.closedById = actorId
  } else {
    update.wonAt = null
  }

  return update
}

export const STAGE_SELECT = {
  maxStage: true,
  firstContactAt: true,
  firstReplyAt: true,
  firstAppointmentAt: true,
  firstOfferAt: true,
  appointmentSetById: true,
  closedById: true,
} as const
