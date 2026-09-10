import type { MetadataRoute } from 'next'

/**
 * PWA manifest. `standalone` plus the maskable icon is what lets the team add
 * the tool to their home screen and use it like a native app.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Akquise CRM',
    short_name: 'Akquise',
    description: 'Wen muss ich heute kontaktieren und was ist der nächste Schritt?',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#fafafb',
    theme_color: '#5b57d8',
    lang: 'de',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Neuer Lead', short_name: 'Neu', url: '/leads/new' },
      { name: 'Aufgaben heute', short_name: 'Aufgaben', url: '/tasks' },
      { name: 'Pipeline', short_name: 'Pipeline', url: '/pipeline' },
    ],
  }
}
