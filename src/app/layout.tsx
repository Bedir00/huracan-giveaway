import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Akquise CRM',
    template: '%s · Akquise CRM',
  },
  description:
    'Fokussiertes Akquise-Tool: Wen muss ich heute kontaktieren und was ist der nächste Schritt?',
  manifest: '/manifest.webmanifest',
  applicationName: 'Akquise',
  appleWebApp: {
    capable: true,
    title: 'Akquise',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafb' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0c0e' },
  ],
}

/**
 * Applies the stored theme before first paint. Without this the page would
 * flash light before hydration on a dark-mode device.
 */
const themeScript = `
try {
  var t = localStorage.getItem('akq-theme');
  if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t;
} catch (e) {}
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
