import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

/** Home-screen icon for iOS, rendered at build time. */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#5b57d8',
        color: '#fff',
        fontSize: 96,
        fontWeight: 700,
        letterSpacing: '-0.05em',
      }}
    >
      A
    </div>,
    size,
  )
}
