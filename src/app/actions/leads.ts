'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { assertAdmin, assertLeadAccess, resolveOwner } from '@/lib/access'
import { requireUser } from '@/lib/auth'
import {
  ACTIVITY_LABELS,
  type ActivityType,
  CHANNELS,
  COMPANY_SIZES,
  LOGGABLE_ACTIVITY_TYPES,
  OUTCOMES,
  POTENTIALS,
  PRIORITIES,
  SOURCES,
  STAGE_LABELS,
  STAGES,
  type Stage,
} from '@/lib/constants'
import { parseDateTimeInput } from '@/lib/dates'
import { prisma } from '@/lib/db'
import { type DuplicateMatch, findDuplicates } from '@/lib/duplicates'
import {
  type ActionState,
  bool,
  guard,
  list,
  num,
  oneOf,
  optionalOneOf,
  req,
  str,
  ValidationError,
} from '@/lib/form'
import { notifyOwner } from '@/lib/notifications'
import { duplicateKeys } from '@/lib/normalize'
import { stageIndex, stageProgress, STAGE_SELECT } from '@/lib/stage'

/** Values echoed back so the form can be restored after a duplicate warning. */
export type LeadFormValuesEcho = {
  company: string
  phone: string
  email: string
  website: string
  instagram: string
  linkedin: string
  industry: string
  location: string
  companySize: string
  source: string
  stage: string
  priority: string
  notes: string
  ownerId: string
  potentials: string[]
  followupTitle: string
  followupDate: string
  followupTime: string
}

export type LeadFormState = ActionState & {
  duplicates?: DuplicateMatch[]
  values?: LeadFormValuesEcho
}

/**
 * React 19 resets uncontrolled inputs once a form action settles, so the
 * duplicate warning has to hand the typed values back as defaults.
 */
function echoValues(fd: FormData): LeadFormValuesEcho {
  const text = (key: string) => str(fd, key) ?? ''
  return {
    company: text('company'),
    phone: text('phone'),
    email: text('email'),
    website: text('website'),
    instagram: text('instagram'),
    linkedin: text('linkedin'),
    industry: text('industry'),
    location: text('location'),
    companySize: text('companySize'),
    source: text('source'),
    stage: text('stage'),
    priority: text('priority'),
    notes: text('notes'),
    ownerId: text('ownerId'),
    potentials: list(fd, 'potentials'),
    followupTitle: text('followupTitle'),
    followupDate: text('followupDate'),
    followupTime: text('followupTime'),
  }
}

const POTENTIAL_KEYS = POTENTIALS.map((p) => p.key)

/**
 * Revalidates every route that shows this lead.
 *
 * Important: the route the user is *currently* on must always be part of this
 * set. A `useActionState` transition only commits once the current route's
 * fresh tree arrives, so an action that revalidates only other paths leaves
 * the form stuck in its pending state.
 */
function refreshLead(leadId: string): void {
  revalidatePath(`/leads/${leadId}`)
  revalidatePath('/leads')
  revalidatePath('/pipeline')
  revalidatePath('/tasks')
  revalidatePath('/')
}

/** Reads the shared company fields from a create/edit form. */
function readLeadFields(fd: FormData) {
  const company = req(fd, 'company', 'Firmenname')
  const phone = str(fd, 'phone')
  const email = str(fd, 'email')
  const website = str(fd, 'website')
  const instagram = str(fd, 'instagram')
  const linkedin = str(fd, 'linkedin')

  // "Kontaktmöglichkeit" is mandatory - but any one channel satisfies it, so
  // creating a lead never stalls on a field the employee does not have yet.
  if (!phone && !email && !website && !instagram && !linkedin) {
    throw new ValidationError(
      'Mindestens eine Kontaktmöglichkeit angeben: Telefon, E-Mail, Website, Instagram oder LinkedIn.',
    )
  }

  const potentials = list(fd, 'potentials').filter((key) => POTENTIAL_KEYS.includes(key as never))

  return {
    company,
    phone,
    email,
    website,
    instagram,
    linkedin,
    industry: str(fd, 'industry'),
    location: str(fd, 'location'),
    companySize: optionalOneOf(str(fd, 'companySize'), COMPANY_SIZES),
    source: oneOf(str(fd, 'source'), SOURCES, 'SONSTIGE'),
    priority: oneOf(str(fd, 'priority'), PRIORITIES, 'WARM'),
    notes: str(fd, 'notes'),
    potentials: JSON.stringify(potentials),
    ...duplicateKeys({ company, website, phone, email }),
  }
}

export async function createLead(_prev: LeadFormState, fd: FormData): Promise<LeadFormState> {
  return guard<LeadFormState>(async () => {
    const user = await requireUser()
    const fields = readLeadFields(fd)
    const stage = oneOf(str(fd, 'stage'), STAGES, 'NEU')
    const ownerId = resolveOwner(user, str(fd, 'ownerId'))

    // Warn once, then let the user decide - a duplicate hint must never block
    // a genuinely new lead.
    if (!bool(fd, 'force')) {
      const duplicates = await findDuplicates(fields)
      if (duplicates.length) {
        return {
          ok: false,
          error: 'Möglicher Duplikat-Treffer gefunden.',
          duplicates,
          values: echoValues(fd),
        }
      }
    }

    const now = new Date()
    const progress = stageProgress(
      {
        maxStage: 'NEU',
        firstContactAt: null,
        firstReplyAt: null,
        firstAppointmentAt: null,
        firstOfferAt: null,
        appointmentSetById: null,
        closedById: null,
      },
      stage,
      user.id,
      now,
    )

    const lead = await prisma.lead.create({
      data: {
        ...fields,
        ...progress,
        ownerId,
        foundById: user.id,
        activities: {
          create: {
            userId: user.id,
            type: 'SYSTEM',
            note: 'Lead angelegt',
          },
        },
      },
    })

    // Optional first next-step straight from the quick-create form.
    const followupTitle = str(fd, 'followupTitle')
    const followupDate = str(fd, 'followupDate')
    if (followupTitle && followupDate) {
      const due = parseDateTimeInput(followupDate, str(fd, 'followupTime'))
      if (due) {
        await prisma.task.create({
          data: {
            leadId: lead.id,
            userId: ownerId ?? user.id,
            title: followupTitle,
            dueAt: due.at,
            hasTime: due.hasTime,
            createdById: user.id,
          },
        })
      }
    }

    if (ownerId && ownerId !== user.id) {
      await notifyOwner({
        leadId: lead.id,
        ownerId,
        actorId: user.id,
        type: 'LEAD_ASSIGNED',
        title: 'Neuer Lead zugewiesen',
        body: lead.company,
      })
    }

    refreshLead(lead.id)
    redirect(`/leads/${lead.id}`)
  })
}

export async function updateLead(_prev: LeadFormState, fd: FormData): Promise<LeadFormState> {
  return guard<LeadFormState>(async () => {
    const user = await requireUser()
    const leadId = req(fd, 'leadId', 'Lead')
    await assertLeadAccess(user, leadId)
    const fields = readLeadFields(fd)

    await prisma.lead.update({
      where: { id: leadId },
      data: { ...fields, dealValue: num(fd, 'dealValue') },
    })

    refreshLead(leadId)
    return { ok: true, message: 'Lead gespeichert.' }
  })
}

export async function changeStage(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireUser()
    const leadId = req(fd, 'leadId', 'Lead')
    const nextStage = oneOf(str(fd, 'stage'), STAGES, 'NEU')
    await assertLeadAccess(user, leadId)

    const lead = await prisma.lead.findUniqueOrThrow({
      where: { id: leadId },
      select: { ...STAGE_SELECT, stage: true, company: true, ownerId: true },
    })
    if (lead.stage === nextStage) return { ok: true }

    const progress = stageProgress(lead, nextStage, user.id)
    const dealValue = num(fd, 'dealValue')
    const lostReason = str(fd, 'lostReason')

    await prisma.$transaction([
      prisma.lead.update({
        where: { id: leadId },
        data: {
          ...progress,
          ...(dealValue !== null ? { dealValue } : {}),
          ...(nextStage === 'VERLOREN' ? { lostReason } : {}),
        },
      }),
      prisma.activity.create({
        data: {
          leadId,
          userId: user.id,
          type: 'STAGE',
          note: `${STAGE_LABELS[lead.stage as Stage]} → ${STAGE_LABELS[nextStage]}${
            lostReason ? ` (${lostReason})` : ''
          }`,
        },
      }),
    ])

    await notifyOwner({
      leadId,
      ownerId: lead.ownerId,
      actorId: user.id,
      type: 'LEAD_CHANGED',
      title: `Status geändert: ${STAGE_LABELS[nextStage]}`,
      body: lead.company,
    })

    refreshLead(leadId)
    return { ok: true, message: `Status: ${STAGE_LABELS[nextStage]}` }
  })
}

/**
 * Stage change for the Kanban board.
 *
 * Takes plain arguments instead of FormData because it is called from a drag
 * handler, and returns a result the board uses to roll back its optimistic
 * move if the write fails.
 */
export async function moveLeadStage(
  leadId: string,
  nextStage: string,
): Promise<{ ok: boolean; error?: string }> {
  const fd = new FormData()
  fd.set('leadId', leadId)
  fd.set('stage', nextStage)
  const result = await changeStage({}, fd)
  return { ok: Boolean(result.ok), error: result.error }
}

export async function assignLead(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireUser()
    assertAdmin(user)
    const leadId = req(fd, 'leadId', 'Lead')
    const ownerId = str(fd, 'ownerId')

    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: { ownerId },
      select: { company: true, ownerId: true },
    })

    await prisma.activity.create({
      data: {
        leadId,
        userId: user.id,
        type: 'SYSTEM',
        note: ownerId
          ? `Zugewiesen an ${(await prisma.user.findUnique({ where: { id: ownerId }, select: { name: true } }))?.name ?? 'Mitarbeiter'}`
          : 'Zuweisung entfernt',
      },
    })

    await notifyOwner({
      leadId,
      ownerId: lead.ownerId,
      actorId: user.id,
      type: 'LEAD_ASSIGNED',
      title: 'Neuer Lead zugewiesen',
      body: lead.company,
    })

    refreshLead(leadId)
    revalidatePath('/team')
    return { ok: true, message: 'Zuweisung aktualisiert.' }
  })
}

/**
 * Logs a contact attempt. Doing so nudges the pipeline forward on its own -
 * an employee should not have to log a call *and* remember to change the
 * status - and can set the next follow-up in the same submit.
 */
export async function logActivity(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireUser()
    const leadId = req(fd, 'leadId', 'Lead')
    await assertLeadAccess(user, leadId)

    const type = oneOf(str(fd, 'type'), LOGGABLE_ACTIVITY_TYPES, 'NOTE') as ActivityType
    const note = str(fd, 'note')
    const outcome = optionalOneOf(str(fd, 'outcome'), OUTCOMES)

    const lead = await prisma.lead.findUniqueOrThrow({
      where: { id: leadId },
      select: { ...STAGE_SELECT, stage: true, company: true, ownerId: true },
    })

    const isContactAttempt = type !== 'NOTE' && type !== 'FOLLOWUP'
    const now = new Date()

    let autoStage: Stage | null = null
    if (outcome === 'REPLIED' && stageIndex(lead.stage) < stageIndex('ANTWORT')) {
      autoStage = 'ANTWORT'
    } else if (isContactAttempt && stageIndex(lead.stage) < stageIndex('KONTAKTIERT')) {
      autoStage = 'KONTAKTIERT'
    }

    const progress = autoStage ? stageProgress(lead, autoStage, user.id, now) : {}

    await prisma.$transaction([
      prisma.activity.create({ data: { leadId, userId: user.id, type, note, outcome } }),
      prisma.lead.update({
        where: { id: leadId },
        data: { ...progress, ...(isContactAttempt ? { lastContactAt: now } : {}) },
      }),
    ])

    if (autoStage) {
      await prisma.activity.create({
        data: {
          leadId,
          userId: user.id,
          type: 'STAGE',
          note: `${STAGE_LABELS[lead.stage as Stage]} → ${STAGE_LABELS[autoStage]} (automatisch)`,
        },
      })
    }

    // Same form, next step: keeps the "always a next action" rule cheap.
    const followupTitle = str(fd, 'followupTitle')
    const followupDate = str(fd, 'followupDate')
    if (followupTitle && followupDate) {
      const due = parseDateTimeInput(followupDate, str(fd, 'followupTime'))
      if (due) {
        await prisma.task.create({
          data: {
            leadId,
            userId: lead.ownerId ?? user.id,
            title: followupTitle,
            dueAt: due.at,
            hasTime: due.hasTime,
            createdById: user.id,
          },
        })
      }
    }

    if (outcome === 'REPLIED') {
      await notifyOwner({
        leadId,
        ownerId: lead.ownerId,
        actorId: user.id,
        type: 'LEAD_REPLIED',
        title: 'Neue Antwort',
        body: lead.company,
      })
    }

    refreshLead(leadId)
    return { ok: true, message: `${ACTIVITY_LABELS[type]} dokumentiert.` }
  })
}

export async function saveContact(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireUser()
    const leadId = req(fd, 'leadId', 'Lead')
    await assertLeadAccess(user, leadId)

    const contactId = str(fd, 'contactId')
    const data = {
      name: req(fd, 'name', 'Name'),
      position: str(fd, 'position'),
      phone: str(fd, 'phone'),
      email: str(fd, 'email'),
      preferredChannel: optionalOneOf(str(fd, 'preferredChannel'), CHANNELS),
      isPrimary: bool(fd, 'isPrimary'),
    }

    if (data.isPrimary) {
      await prisma.contact.updateMany({ where: { leadId }, data: { isPrimary: false } })
    }

    if (contactId) {
      await prisma.contact.update({ where: { id: contactId, leadId }, data })
    } else {
      await prisma.contact.create({ data: { ...data, leadId } })
    }

    refreshLead(leadId)
    return { ok: true, message: 'Ansprechpartner gespeichert.' }
  })
}

export async function deleteContact(fd: FormData): Promise<void> {
  const user = await requireUser()
  const leadId = String(fd.get('leadId') ?? '')
  const contactId = String(fd.get('contactId') ?? '')
  await assertLeadAccess(user, leadId)
  await prisma.contact.deleteMany({ where: { id: contactId, leadId } })
  refreshLead(leadId)
}

export async function deleteLead(fd: FormData): Promise<void> {
  const user = await requireUser()
  assertAdmin(user)
  const leadId = String(fd.get('leadId') ?? '')
  await prisma.lead.delete({ where: { id: leadId } })
  revalidatePath('/leads')
  revalidatePath('/pipeline')
  redirect('/leads')
}
