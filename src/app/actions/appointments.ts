'use server'

import { revalidatePath } from 'next/cache'
import { assertLeadAccess } from '@/lib/access'
import { requireUser } from '@/lib/auth'
import { APPOINTMENT_KINDS, APPOINTMENT_RESULTS, STAGE_LABELS, type Stage } from '@/lib/constants'
import { parseDateTimeInput } from '@/lib/dates'
import { prisma } from '@/lib/db'
import {
  type ActionState,
  guard,
  int,
  oneOf,
  optionalOneOf,
  req,
  str,
  ValidationError,
} from '@/lib/form'
import { stageIndex, stageProgress, STAGE_SELECT } from '@/lib/stage'

function refresh(leadId: string): void {
  revalidatePath('/', 'layout')
  revalidatePath('/appointments')
  revalidatePath(`/leads/${leadId}`)
  revalidatePath('/pipeline')
}

export async function saveAppointment(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireUser()
    const leadId = req(fd, 'leadId', 'Lead')
    const lead = await assertLeadAccess(user, leadId)

    const when = parseDateTimeInput(str(fd, 'date'), str(fd, 'time') ?? '09:00')
    if (!when) throw new ValidationError('Bitte Datum und Uhrzeit für den Termin angeben.')

    const data = {
      startsAt: when.at,
      durationMin: int(fd, 'durationMin', 30),
      kind: oneOf(str(fd, 'kind'), APPOINTMENT_KINDS, 'CALL'),
      participants: str(fd, 'participants'),
      notes: str(fd, 'notes'),
      result: optionalOneOf(str(fd, 'result'), APPOINTMENT_RESULTS) ?? 'OPEN',
    }

    const appointmentId = str(fd, 'appointmentId')
    if (appointmentId) {
      await prisma.appointment.update({ where: { id: appointmentId, leadId }, data })
    } else {
      await prisma.appointment.create({ data: { ...data, leadId, userId: user.id } })
      await prisma.activity.create({
        data: {
          leadId,
          userId: user.id,
          type: 'MEETING',
          note: `Termin vereinbart: ${when.at.toLocaleString('de-DE')}`,
        },
      })

      // Booking a meeting is what "Termin vereinbart" means - move the lead
      // there automatically instead of asking for a second click.
      const current = await prisma.lead.findUniqueOrThrow({
        where: { id: leadId },
        select: { ...STAGE_SELECT, stage: true },
      })
      if (stageIndex(current.stage) < stageIndex('TERMIN')) {
        await prisma.lead.update({
          where: { id: leadId },
          data: stageProgress(current, 'TERMIN', user.id),
        })
        await prisma.activity.create({
          data: {
            leadId,
            userId: user.id,
            type: 'STAGE',
            note: `${STAGE_LABELS[current.stage as Stage]} → ${STAGE_LABELS.TERMIN} (automatisch)`,
          },
        })
      }
    }

    refresh(lead.id)
    return { ok: true, message: 'Termin gespeichert.' }
  })
}

export async function deleteAppointment(fd: FormData): Promise<void> {
  const user = await requireUser()
  const appointmentId = String(fd.get('appointmentId') ?? '')
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { id: true, leadId: true },
  })
  if (!appointment) return
  await assertLeadAccess(user, appointment.leadId)
  await prisma.appointment.delete({ where: { id: appointment.id } })
  refresh(appointment.leadId)
}

export async function setAppointmentResult(fd: FormData): Promise<void> {
  const user = await requireUser()
  const appointmentId = String(fd.get('appointmentId') ?? '')
  const result = optionalOneOf(String(fd.get('result') ?? ''), APPOINTMENT_RESULTS) ?? 'OPEN'
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { id: true, leadId: true },
  })
  if (!appointment) return
  await assertLeadAccess(user, appointment.leadId)
  await prisma.appointment.update({ where: { id: appointment.id }, data: { result } })
  refresh(appointment.leadId)
}
