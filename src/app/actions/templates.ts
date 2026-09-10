'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/access'
import { requireUser } from '@/lib/auth'
import { TEMPLATE_CATEGORIES } from '@/lib/constants'
import { prisma } from '@/lib/db'
import { type ActionState, guard, oneOf, req, str } from '@/lib/form'

export async function saveTemplate(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireUser()
    assertAdmin(user)

    const data = {
      title: req(fd, 'title', 'Titel'),
      category: oneOf(str(fd, 'category'), TEMPLATE_CATEGORIES, 'OTHER'),
      body: req(fd, 'body', 'Inhalt'),
    }

    const id = str(fd, 'templateId')
    if (id) await prisma.template.update({ where: { id }, data })
    else await prisma.template.create({ data })

    revalidatePath('/templates')
    return { ok: true, message: 'Vorlage gespeichert.' }
  })
}

export async function deleteTemplate(fd: FormData): Promise<void> {
  const user = await requireUser()
  assertAdmin(user)
  await prisma.template.deleteMany({ where: { id: String(fd.get('templateId') ?? '') } })
  revalidatePath('/templates')
}
