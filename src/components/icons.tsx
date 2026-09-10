import type { SVGProps } from 'react'

/**
 * Inline icon set. Hand-rolled so the app ships no icon dependency and every
 * glyph shares the same 24px grid, 1.7 stroke and round caps.
 */

type IconProps = SVGProps<SVGSVGElement>

function Svg({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      width="1em"
      height="1em"
      {...props}
    >
      {children}
    </svg>
  )
}

export const IconHome = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.8V20h14V9.8" />
    <path d="M9.5 20v-5.5h5V20" />
  </Svg>
)

export const IconLeads = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 20V7.5A1.5 1.5 0 0 1 5 6h6.5v14" />
    <path d="M11.5 10H19a1.5 1.5 0 0 1 1.5 1.5V20" />
    <path d="M2.5 20h19" />
    <path d="M6.5 9.5h2M6.5 13h2M6.5 16.5h2M14.5 13.5h3M14.5 16.5h3" />
  </Svg>
)

export const IconPipeline = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="4" width="5" height="16" rx="1.5" />
    <rect x="10" y="4" width="5" height="11" rx="1.5" />
    <rect x="17" y="4" width="4" height="7" rx="1.5" />
  </Svg>
)

export const IconTasks = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 6.5l2 2 3.5-3.5" />
    <path d="M4 13l2 2 3.5-3.5" />
    <path d="M13 6.5h7M13 13h7M4.5 19.5h15.5" />
  </Svg>
)

export const IconCalendar = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path d="M3.5 9.5h17M8 3.5V6M16 3.5V6" />
    <path d="M7.5 13h2.5M7.5 16.5h2.5M14 13h2.5" />
  </Svg>
)

export const IconTemplates = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 3.5h8l4.5 4.5V20a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Z" />
    <path d="M13.75 3.75V8.5h4.75" />
    <path d="M8.5 12.5h7M8.5 16h4.5" />
  </Svg>
)

export const IconTeam = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    <path d="M16 5.6a3.2 3.2 0 0 1 0 5.8" />
    <path d="M17.5 15.4c1.8.7 3 2.4 3 4.6" />
  </Svg>
)

export const IconAnalytics = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 20.5h17" />
    <path d="M6.5 20.5V13M11 20.5V7.5M15.5 20.5v-5M20 20.5V4" />
  </Svg>
)

export const IconSettings = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="2.8" />
    <path d="M12 3.5v2.2M12 18.3v2.2M4.9 7.8l1.9 1.1M17.2 15.1l1.9 1.1M4.9 16.2l1.9-1.1M17.2 8.9l1.9-1.1" />
  </Svg>
)

export const IconSearch = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="M15 15l5 5" />
  </Svg>
)

export const IconBell = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5S6.5 14 6.5 10Z" />
    <path d="M10 18.5a2.2 2.2 0 0 0 4 0" />
  </Svg>
)

export const IconPlus = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5.5v13M5.5 12h13" />
  </Svg>
)

export const IconPhone = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7.2 3.8h2.3l1.4 3.6-1.9 1.4a10 10 0 0 0 5 5l1.4-1.9 3.6 1.4v2.3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 5.2 6a2 2 0 0 1 2-2.2Z" />
  </Svg>
)

export const IconWhatsapp = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.8a8 8 0 0 0-6.9 12l-1 3.6 3.7-1a8 8 0 1 0 4.2-14.6Z" />
    <path d="M9.3 8.6c.3 1.9 2.4 4.1 4.4 4.5l1-1.2 1.6.8c-.2 1-.9 1.5-1.9 1.4-2.8-.3-5.5-3-5.9-5.8-.1-1 .4-1.7 1.4-1.9l.8 1.6-1.4.6Z" />
  </Svg>
)

export const IconMail = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="2" />
    <path d="M3.6 6.8 12 12.8l8.4-6" />
  </Svg>
)

export const IconInstagram = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.8" y="3.8" width="16.4" height="16.4" rx="4.6" />
    <circle cx="12" cy="12" r="3.6" />
    <path d="M16.9 7.1h.01" strokeWidth={2.4} />
  </Svg>
)

export const IconLinkedin = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
    <path d="M7.8 10.5V16M7.8 7.9h.01" strokeWidth={2} />
    <path d="M11.5 16v-3.2a1.9 1.9 0 0 1 3.8 0V16" />
    <path d="M11.5 10.5V16" />
  </Svg>
)

export const IconGlobe = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17" />
    <path d="M12 3.5c2.2 2.3 3.4 5.3 3.4 8.5S14.2 18.2 12 20.5c-2.2-2.3-3.4-5.3-3.4-8.5S9.8 5.8 12 3.5Z" />
  </Svg>
)

export const IconNote = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 4.5h15v10l-5 5h-10Z" />
    <path d="M19.5 14.5h-5v5" />
    <path d="M8 8.5h8M8 11.5h6" />
  </Svg>
)

export const IconClock = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
)

export const IconAlert = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4.2 21 19.5H3Z" />
    <path d="M12 9.5v4.2M12 16.6h.01" strokeWidth={2} />
  </Svg>
)

export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 12.5 9.5 17.5 20 6.5" />
  </Svg>
)

export const IconX = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
)

export const IconChevronRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.5 5.5 16 12l-6.5 6.5" />
  </Svg>
)

export const IconChevronDown = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5.5 9.5 12 16l6.5-6.5" />
  </Svg>
)

export const IconArrowRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 12h15M13.5 6l6 6-6 6" />
  </Svg>
)

export const IconFilter = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 6.5h16M7 12h10M10 17.5h4" />
  </Svg>
)

export const IconDownload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4v10M8 10.5 12 14.5l4-4" />
    <path d="M4.5 18.5h15" />
  </Svg>
)

export const IconUpload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 14.5V4.5M8 8.5 12 4.5l4 4" />
    <path d="M4.5 18.5h15" />
  </Svg>
)

export const IconTrash = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 7h15M9.5 7V4.5h5V7" />
    <path d="M6.5 7l.8 12.5h9.4L17.5 7" />
    <path d="M10.5 10.5v6M13.5 10.5v6" />
  </Svg>
)

export const IconEdit = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 19.5h4l10-10-4-4-10 10Z" />
    <path d="M13.5 6.5l4 4" />
  </Svg>
)

export const IconCopy = (p: IconProps) => (
  <Svg {...p}>
    <rect x="9" y="9" width="11.5" height="11.5" rx="2" />
    <path d="M15 6.5V5.5A2 2 0 0 0 13 3.5H5.5A2 2 0 0 0 3.5 5.5V13a2 2 0 0 0 2 2h1" />
  </Svg>
)

export const IconExternal = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 4.5h5.5V10" />
    <path d="M19.5 4.5 11 13" />
    <path d="M18 14.5v4a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6h4" />
  </Svg>
)

export const IconMore = (p: IconProps) => (
  <Svg {...p} strokeWidth={2.2}>
    <path d="M6 12h.01M12 12h.01M18 12h.01" />
  </Svg>
)

export const IconMenu = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
)

export const IconLogout = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H10" />
    <path d="M14 8.5 17.5 12 14 15.5M9.5 12h8" />
  </Svg>
)

export const IconSun = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
  </Svg>
)

export const IconMoon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
  </Svg>
)

export const IconMeeting = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 7.5h11v9h-11z" />
    <path d="M14.5 11l6-3v8l-6-3z" />
  </Svg>
)

export const IconOffer = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5.5 3.5h13v17l-6.5-3-6.5 3Z" />
    <path d="M9 8.5h6M9 12h4" />
  </Svg>
)

export const IconTarget = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1" strokeWidth={2} />
  </Svg>
)

export const IconSparkle = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6Z" />
    <path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7Z" />
  </Svg>
)

export const IconGrip = (p: IconProps) => (
  <Svg {...p} strokeWidth={2.2}>
    <path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" />
  </Svg>
)

export const IconInbox = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 13.5h4l1.5 3h6l1.5-3h4" />
    <path d="M3.5 13.5 6 5h12l2.5 8.5v5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5Z" />
  </Svg>
)
