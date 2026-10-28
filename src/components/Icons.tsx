type P = { size?: number }

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

export const GithubIcon = ({ size = 20 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
  </svg>
)

export const DownloadIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <path d="M12 3v12m0 0-5-5m5 5 5-5M4 21h16" />
  </svg>
)

export const CopyIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </svg>
)

export const LinkIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <path d="M10 14a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1" />
    <path d="M14 10a5 5 0 0 0-7.07 0l-3 3A5 5 0 0 0 11 20.07l1-1" />
  </svg>
)

export const ImageIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-5-5L5 21" />
  </svg>
)

export const SparkIcon = ({ size = 14 }: P) => (
  <svg {...base(size)} strokeWidth={2}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
  </svg>
)

export const ShieldIcon = ({ size = 24 }: P) => (
  <svg {...base(size)}>
    <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

export const ArrowLeft = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <path d="M19 12H5m0 0 6-6m-6 6 6 6" />
  </svg>
)

export const ArrowRight = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <path d="M5 12h14m0 0-6-6m6 6-6 6" />
  </svg>
)

export const SaveIcon = ({ size = 16 }: P) => (
  <svg {...base(size)}>
    <path d="M5 4h11l3 3v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4Z" />
    <path d="M8 4v5h7V4M8 20v-6h8v6" />
  </svg>
)

export const TrashIcon = ({ size = 16 }: P) => (
  <svg {...base(size)}>
    <path d="M4 7h16M10 11v6m4-6v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3" />
  </svg>
)

export const UploadIcon = ({ size = 16 }: P) => (
  <svg {...base(size)}>
    <path d="M12 16V4m0 0-5 5m5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
  </svg>
)
