import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import { GlobalSearch } from '@/components/GlobalSearch'
import { IconLogout, IconPlus, IconSparkle } from '@/components/icons'
import { NotificationBell } from '@/components/NotificationBell'
import { visibleNav } from '@/components/nav'
import { PwaRegister } from '@/components/PwaRegister'
import { MobileTabBar, Sidebar } from '@/components/Sidebar'
import { ThemeToggle } from '@/components/ThemeToggle'
import { requireUser } from '@/lib/auth'
import { ROLE_LABELS } from '@/lib/constants'
import { startOfDay } from '@/lib/dates'
import { prisma } from '@/lib/db'
import { getNotifications } from '@/lib/notifications'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const isAdmin = user.role === 'ADMIN'

  const [notifications, overdueTasks] = await Promise.all([
    getNotifications(user),
    prisma.task.count({ where: { userId: user.id, done: false, dueAt: { lt: startOfDay() } } }),
  ])

  const items = visibleNav(isAdmin)

  return (
    <div className="flex min-h-dvh">
      <Sidebar
        items={items}
        counts={{ tasks: overdueTasks }}
        user={{ name: user.name, roleLabel: ROLE_LABELS[user.role] }}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-2 px-3 sm:px-5 h-14 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg-elevated)_88%,transparent)] backdrop-blur-lg no-print">
          <Link href="/" className="lg:hidden flex items-center gap-2 shrink-0" aria-label="Start">
            <span
              className="flex items-center justify-center w-7 h-7 rounded-lg text-white text-sm"
              style={{ background: 'var(--accent)' }}
            >
              <IconSparkle />
            </span>
          </Link>

          <GlobalSearch />

          <div className="flex items-center gap-1 ml-auto shrink-0">
            <Link
              href="/leads/new"
              className="btn btn-primary btn-sm lg:hidden"
              aria-label="Neuer Lead"
            >
              <IconPlus />
              <span className="hidden xs:inline">Lead</span>
            </Link>
            <ThemeToggle />
            <NotificationBell
              items={notifications.map((item) => ({
                id: item.id,
                title: item.title,
                body: item.body,
                href: item.href,
                createdAt: item.createdAt.toISOString(),
                tone: item.tone,
              }))}
            />
            <form action={logout} className="hidden lg:block">
              <button type="submit" className="btn btn-ghost btn-icon" aria-label="Abmelden">
                <IconLogout className="text-base" />
              </button>
            </form>
          </div>
        </header>

        {/* Bottom padding keeps the last row clear of the mobile tab bar. */}
        <main className="flex-1 px-3 sm:px-5 lg:px-7 py-4 sm:py-6 pb-24 lg:pb-8 max-w-[100rem] w-full">
          {children}
        </main>
      </div>

      <MobileTabBar items={items} />
      <PwaRegister />
    </div>
  )
}
