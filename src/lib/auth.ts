import { randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { prisma } from './db'
import type { Role } from './constants'

export const SESSION_COOKIE = 'akq_session'
const SESSION_DAYS = 30

export type SessionUser = {
  id: string
  name: string
  email: string
  role: Role
}

export async function createSession(userId: string): Promise<void> {
  const id = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await prisma.session.create({ data: { id, userId, expiresAt } })

  const jar = await cookies()
  jar.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  })
}

export async function destroySession(): Promise<void> {
  const jar = await cookies()
  const id = jar.get(SESSION_COOKIE)?.value
  if (id) await prisma.session.deleteMany({ where: { id } })
  jar.delete(SESSION_COOKIE)
}

/**
 * Resolves the signed-in user. Cached per request so every page, layout and
 * component can ask for it without extra queries.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies()
  const id = jar.get(SESSION_COOKIE)?.value
  if (!id) return null

  const session = await prisma.session.findUnique({
    where: { id },
    include: { user: true },
  })
  if (!session || session.expiresAt < new Date() || !session.user.active) return null

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role as Role,
  }
})

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  return user
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser()
  if (user.role !== 'ADMIN') redirect('/')
  return user
}

export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === 'ADMIN'
}

/**
 * Employees only ever see their own leads; admins see everything. Returning a
 * Prisma `where` fragment keeps that rule in exactly one place.
 */
export function leadScope(user: SessionUser): { ownerId?: string } {
  return user.role === 'ADMIN' ? {} : { ownerId: user.id }
}
