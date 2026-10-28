import questionsJson from '../data/questions.json'
import courantsJson from '../data/courants.json'
import type { AxisId } from '../data/axes'
import type { ThemeId } from '../data/themes'

export interface Question {
  id: number
  theme: ThemeId
  text: string
  axes: Partial<Record<AxisId, number>>
  /** Aide affichée dans le dépliant « Comprendre la question ». */
  help: { explain: string; agree: string; disagree: string }
}

export interface Courant {
  id: string
  name: string
  short: string
  summary: string
  ideas: string[]
  origins: string
  figures: string[]
  position: Record<AxisId, number>
  weights: Partial<Record<AxisId, number>>
}

export const QUESTIONS = questionsJson as Question[]
export const COURANTS = courantsJson as Courant[]
export const QUESTION_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]))

/** Échelle de réponse à 7 niveaux, dans l'ordre d'affichage. */
export const SCALE = [
  { value: 3, label: "Tout à fait d'accord" },
  { value: 2, label: "D'accord" },
  { value: 1, label: "Plutôt d'accord" },
  { value: 0, label: 'Neutre' },
  { value: -1, label: "Plutôt pas d'accord" },
  { value: -2, label: "Pas d'accord" },
  { value: -3, label: "Pas du tout d'accord" },
] as const

export const SCALE_LABEL: Record<number, string> = Object.fromEntries(SCALE.map((s) => [s.value, s.label]))
