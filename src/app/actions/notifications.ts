'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function markNotificationsRead(): Promise<void> {
  const user = await requireUser()
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  })
  // The bell is part of the app shell, so the whole layout has to refresh -
  // otherwise the badge stays until the next hard navigation.
  revalidatePath('/', 'layout')
}

export async function markNotificationRead(fd: FormData): Promise<void> {
  const user = await requireUser()
  const id = String(fd.get('notificationId') ?? '')
  await prisma.notification.updateMany({
    where: { id, userId: user.id },
    data: { readAt: new Date() },
  })
  revalidatePath('/', 'layout')
}
