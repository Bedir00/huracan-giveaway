'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSession, destroySession, requireUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { type ActionState, guard, req, str, ValidationError } from '@/lib/form'
import { hashPassword, verifyPassword } from '@/lib/password'

export async function login(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const email = req(fd, 'email', 'E-Mail').toLowerCase()
    const password = req(fd, 'password', 'Passwort')

    const user = await prisma.user.findUnique({ where: { email } })
    // Same message either way so the form cannot be used to probe for accounts.
    if (!user || !user.active || !(await verifyPassword(password, user.passwordHash))) {
      throw new ValidationError('E-Mail oder Passwort ist falsch.')
    }

    await createSession(user.id)
    redirect('/')
  })
}

export async function logout(): Promise<void> {
  await destroySession()
  redirect('/login')
}

export async function updateProfile(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireUser()
    const name = req(fd, 'name', 'Name')
    const email = req(fd, 'email', 'E-Mail').toLowerCase()

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing && existing.id !== user.id) {
      throw new ValidationError('Diese E-Mail wird bereits verwendet.')
    }

    await prisma.user.update({ where: { id: user.id }, data: { name, email } })
    // The signed-in name is rendered by the app shell, so refresh the layout.
    revalidatePath('/', 'layout')
    return { ok: true, message: 'Profil gespeichert.' }
  })
}

export async function changePassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireUser()
    const current = req(fd, 'current', 'Aktuelles Passwort')
    const next = req(fd, 'next', 'Neues Passwort')
    const confirm = str(fd, 'confirm')

    if (next.length < 8)
      throw new ValidationError('Das neue Passwort braucht mindestens 8 Zeichen.')
    if (next !== confirm) throw new ValidationError('Die Passwörter stimmen nicht überein.')

    const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
    if (!(await verifyPassword(current, row.passwordHash))) {
      throw new ValidationError('Das aktuelle Passwort ist falsch.')
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(next) },
    })
    revalidatePath('/settings')
    return { ok: true, message: 'Passwort geändert.' }
  })
}
