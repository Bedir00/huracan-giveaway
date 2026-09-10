import type { ReactNode } from 'react'
import {
  IconAnalytics,
  IconCalendar,
  IconHome,
  IconLeads,
  IconPipeline,
  IconSettings,
  IconTasks,
  IconTeam,
  IconTemplates,
} from './icons'

export type NavItem = {
  href: string
  label: string
  shortLabel?: string
  icon: ReactNode
  adminOnly?: boolean
  /** Key of the badge count supplied by the shell. */
  count?: 'tasks'
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', shortLabel: 'Home', icon: <IconHome className="nav-icon" /> },
  { href: '/leads', label: 'Leads', icon: <IconLeads className="nav-icon" /> },
  { href: '/pipeline', label: 'Pipeline', icon: <IconPipeline className="nav-icon" /> },
  {
    href: '/tasks',
    label: 'Aufgaben',
    icon: <IconTasks className="nav-icon" />,
    count: 'tasks',
  },
  { href: '/appointments', label: 'Termine', icon: <IconCalendar className="nav-icon" /> },
  { href: '/templates', label: 'Vorlagen', icon: <IconTemplates className="nav-icon" /> },
  { href: '/team', label: 'Team', icon: <IconTeam className="nav-icon" />, adminOnly: true },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: <IconAnalytics className="nav-icon" />,
    adminOnly: true,
  },
  { href: '/settings', label: 'Einstellungen', icon: <IconSettings className="nav-icon" /> },
]

/** The four items that earn a permanent slot in the mobile bottom bar. */
export const MOBILE_PRIMARY = ['/', '/leads', '/tasks', '/pipeline']

export function visibleNav(isAdmin: boolean): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin)
}
