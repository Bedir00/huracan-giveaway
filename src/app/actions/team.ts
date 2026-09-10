'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/access'
import { requireUser } from '@/lib/auth'
import { ROLES } from '@/lib/constants'
import { prisma } from '@/lib/db'
import { type ActionState, bool, guard, oneOf, req, str, ValidationError } from '@/lib/form'
import { hashPassword } from '@/lib/password'

export async function saveUser(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const admin = await requireUser()
    assertAdmin(admin)

    const userId = str(fd, 'userId')
    const name = req(fd, 'name', 'Name')
    const email = req(fd, 'email', 'E-Mail').toLowerCase()
    const role = oneOf(str(fd, 'role'), ROLES, 'AGENT')
    const active = bool(fd, 'active')

    const clash = await prisma.user.findUnique({ where: { email } })
    if (clash && clash.id !== userId)
      throw new ValidationError('Diese E-Mail wird bereits verwendet.')

    if (userId) {
      // An admin must not lock the team out by demoting or disabling the last
      // remaining active admin.
      if (role !== 'ADMIN' || !active) {
        const otherAdmins = await prisma.user.count({
          where: { role: 'ADMIN', active: true, id: { not: userId } },
        })
        if (!otherAdmins) throw new ValidationError('Es muss mindestens ein aktiver Admin bleiben.')
      }
      await prisma.user.update({ where: { id: userId }, data: { name, email, role, active } })
      if (!active) await prisma.session.deleteMany({ where: { userId } })
      revalidatePath('/team')
      revalidatePath('/leads')
      return { ok: true, message: 'Mitarbeiter gespeichert.' }
    }

    const password = req(fd, 'password', 'Passwort')
    if (password.length < 8) throw new ValidationError('Das Passwort braucht mindestens 8 Zeichen.')

    await prisma.user.create({
      data: { name, email, role, active, passwordHash: await hashPassword(password) },
    })

    revalidatePath('/team')
    return { ok: true, message: `${name} wurde angelegt.` }
  })
}

export async function resetUserPassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const admin = await requireUser()
    assertAdmin(admin)
    const userId = req(fd, 'userId', 'Mitarbeiter')
    const password = req(fd, 'password', 'Passwort')
    if (password.length < 8) throw new ValidationError('Das Passwort braucht mindestens 8 Zeichen.')

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(password) },
    })
    // Force a fresh sign-in everywhere with the new password.
    await prisma.session.deleteMany({ where: { userId } })

    revalidatePath('/team')
    return { ok: true, message: 'Passwort neu gesetzt.' }
  })
}

/** Moves every lead from one employee to another - used before offboarding. */
export async function reassignLeads(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const admin = await requireUser()
    assertAdmin(admin)
    const fromId = req(fd, 'fromId', 'Von')
    const toId = str(fd, 'toId')

    const { count } = await prisma.lead.updateMany({
      where: { ownerId: fromId },
      data: { ownerId: toId },
    })
    await prisma.task.updateMany({
      where: { userId: fromId, done: false },
      data: { userId: toId ?? fromId },
    })

    revalidatePath('/team')
    revalidatePath('/leads')
    revalidatePath('/pipeline')
    return { ok: true, message: `${count} Leads übertragen.` }
  })
}
