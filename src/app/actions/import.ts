'use server'

import { revalidatePath } from 'next/cache'
import { resolveOwner } from '@/lib/access'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { findDuplicates } from '@/lib/duplicates'
import { type ActionState, bool, guard, str, ValidationError } from '@/lib/form'
import { parseCsvObjects } from '@/lib/csv'
import {
  parseAmount,
  pick,
  resolvePotentials,
  resolvePriority,
  resolveSource,
  resolveStage,
} from '@/lib/import'
import { duplicateKeys } from '@/lib/normalize'
import { stageProgress } from '@/lib/stage'

export type ImportState = ActionState & {
  imported?: number
  skipped?: number
  problems?: string[]
}

const MAX_ROWS = 2000

export async function importLeads(_prev: ImportState, fd: FormData): Promise<ImportState> {
  return guard<ImportState>(async () => {
    const user = await requireUser()
    const file = fd.get('file')
    if (!(file instanceof File) || file.size === 0) {
      throw new ValidationError('Bitte eine CSV-Datei auswählen.')
    }

    const rows = parseCsvObjects(await file.text())
    if (!rows.length) throw new ValidationError('Die Datei enthält keine Datensätze.')
    if (rows.length > MAX_ROWS) {
      throw new ValidationError(`Maximal ${MAX_ROWS} Zeilen pro Import - bitte aufteilen.`)
    }

    const skipDuplicates = !bool(fd, 'allowDuplicates')
    const defaultOwner = resolveOwner(user, str(fd, 'ownerId'))

    let imported = 0
    let skipped = 0
    const problems: string[] = []

    for (const [index, row] of rows.entries()) {
      const line = index + 2 // +1 for the header, +1 for 1-based counting
      const company = pick(row, 'company')
      if (!company) {
        problems.push(`Zeile ${line}: kein Firmenname - übersprungen.`)
        continue
      }

      const website = pick(row, 'website')
      const phone = pick(row, 'phone')
      const email = pick(row, 'email')

      if (skipDuplicates) {
        const duplicates = await findDuplicates({ company, website, phone, email })
        if (duplicates.length) {
          skipped++
          problems.push(`Zeile ${line}: "${company}" existiert bereits - übersprungen.`)
          continue
        }
      }

      const stage = resolveStage(pick(row, 'stage'))
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
      )

      const contactName = pick(row, 'contactName')

      await prisma.lead.create({
        data: {
          company,
          industry: pick(row, 'industry'),
          location: pick(row, 'location'),
          website,
          instagram: pick(row, 'instagram'),
          linkedin: pick(row, 'linkedin'),
          phone,
          email,
          companySize: pick(row, 'companySize'),
          source: resolveSource(pick(row, 'source')),
          priority: resolvePriority(pick(row, 'priority')),
          potentials: JSON.stringify(resolvePotentials(pick(row, 'potentials'))),
          notes: pick(row, 'notes'),
          dealValue: parseAmount(pick(row, 'dealValue')),
          ownerId: defaultOwner,
          foundById: user.id,
          ...progress,
          ...duplicateKeys({ company, website, phone, email }),
          activities: {
            create: { userId: user.id, type: 'SYSTEM', note: `Lead per CSV-Import angelegt` },
          },
          ...(contactName
            ? {
                contacts: {
                  create: {
                    name: contactName,
                    position: pick(row, 'contactPosition'),
                    phone: pick(row, 'contactPhone'),
                    email: pick(row, 'contactEmail'),
                    isPrimary: true,
                  },
                },
              }
            : {}),
        },
      })
      imported++
    }

    revalidatePath('/leads')
    revalidatePath('/pipeline')
    revalidatePath('/')
    revalidatePath('/settings/import')

    return {
      ok: true,
      imported,
      skipped,
      // Long lists are useless in a toast - show the first handful.
      problems: problems.slice(0, 25),
      message: `${imported} Leads importiert${skipped ? `, ${skipped} Duplikate übersprungen` : ''}.`,
    }
  })
}
