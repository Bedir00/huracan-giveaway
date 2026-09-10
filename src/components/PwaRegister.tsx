'use client'

import { useEffect } from 'react'

/** Registers the service worker so the app installs as a PWA. */
export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') return
    const timer = setTimeout(() => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Offline support is a nice-to-have; the app works fine without it.
      })
    }, 1200)
    return () => clearTimeout(timer)
  }, [])

  return null
}
