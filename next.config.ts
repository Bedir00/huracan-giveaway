import type { NextConfig } from 'next'

const config: NextConfig = {
  experimental: {
    // Server Actions receive multipart CSV uploads for the lead import.
    serverActions: { bodySizeLimit: '8mb' },
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ]
  },
}

export default config
