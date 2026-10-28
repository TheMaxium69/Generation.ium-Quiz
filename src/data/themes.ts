export type ThemeId =
  | 'economie'
  | 'travail'
  | 'immigration'
  | 'securite'
  | 'europe'
  | 'ecologie'
  | 'societe'
  | 'institutions'
  | 'international'
  | 'education'

export const THEMES: { id: ThemeId; name: string }[] = [
  { id: 'economie', name: 'Économie et fiscalité' },
  { id: 'travail', name: 'Travail et protection sociale' },
  { id: 'immigration', name: 'Immigration et identité' },
  { id: 'securite', name: 'Sécurité et justice' },
  { id: 'europe', name: 'Europe et souveraineté' },
  { id: 'ecologie', name: 'Écologie et énergie' },
  { id: 'societe', name: 'Société et mœurs' },
  { id: 'institutions', name: 'Institutions et démocratie' },
  { id: 'international', name: 'International et défense' },
  { id: 'education', name: 'Éducation, culture et numérique' },
]

export const THEME_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t])) as Record<
  ThemeId,
  { id: ThemeId; name: string }
>
