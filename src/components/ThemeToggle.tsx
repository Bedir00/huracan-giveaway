'use client'

import { useEffect, useState } from 'react'
import { IconMoon, IconSun } from './icons'

type Theme = 'light' | 'dark' | 'system'

/** Cycles light → dark → system; the choice is remembered per device. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    const stored = localStorage.getItem('akq-theme')
    if (stored === 'dark' || stored === 'light') setTheme(stored)
  }, [])

  function apply(next: Theme) {
    setTheme(next)
    if (next === 'system') {
      delete document.documentElement.dataset.theme
      localStorage.removeItem('akq-theme')
    } else {
      document.documentElement.dataset.theme = next
      localStorage.setItem('akq-theme', next)
    }
  }

  const label = theme === 'dark' ? 'Dunkel' : theme === 'light' ? 'Hell' : 'Systemeinstellung'

  return (
    <button
      type="button"
      className="btn btn-ghost btn-icon"
      title={`Design: ${label}`}
      aria-label={`Design umschalten (aktuell: ${label})`}
      onClick={() => apply(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light')}
    >
      {theme === 'dark' ? <IconMoon className="text-base" /> : <IconSun className="text-base" />}
    </button>
  )
}
