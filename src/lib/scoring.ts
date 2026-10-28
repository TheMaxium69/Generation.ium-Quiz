import { AXES, LEFT_RIGHT_WEIGHTS, type AxisId } from '../data/axes'
import { THEMES, type ThemeId } from '../data/themes'
import { COURANTS, QUESTIONS, type Courant, type Question } from './data'

/** Valeur de -3 à +3, ou 'skip' si la personne a passé la question. */
export type AnswerValue = number | 'skip'
export type Answers = Record<number, AnswerValue>

export interface AxisScore {
  /** Score de -1 à +1, null si aucune question répondue ne porte sur cet axe. */
  score: number | null
  /** Somme des poids absolus des questions répondues (mesure de la quantité d'information). */
  coverage: number
  /** Nombre de questions répondues touchant cet axe. */
  count: number
}

export type AxisScores = Record<AxisId, AxisScore>

export interface Affinity {
  courant: Courant
  /** Pourcentage d'affinité de 0 à 100. */
  affinity: number
  /** Distance pondérée normalisée (0 = identique, 1 = opposé). */
  distance: number
}

export interface ThemeResult {
  theme: ThemeId
  answered: number
  total: number
  axes: AxisScores
  leftRight: number | null
  affinities: Affinity[]
}

export interface Results {
  answered: number
  skipped: number
  total: number
  axes: AxisScores
  leftRight: number | null
  affinities: Affinity[]
  themes: ThemeResult[]
}

export function computeAxisScores(answers: Answers, questions: Question[] = QUESTIONS): AxisScores {
  const acc = Object.fromEntries(AXES.map((a) => [a.id, { sum: 0, max: 0, count: 0 }])) as Record<
    AxisId,
    { sum: number; max: number; count: number }
  >
  for (const q of questions) {
    const v = answers[q.id]
    if (typeof v !== 'number') continue
    for (const [axis, w] of Object.entries(q.axes) as [AxisId, number][]) {
      if (!w) continue
      acc[axis].sum += v * w
      acc[axis].max += 3 * Math.abs(w)
      acc[axis].count += 1
    }
  }
  return Object.fromEntries(
    AXES.map((a) => {
      const { sum, max, count } = acc[a.id]
      return [a.id, { score: max > 0 ? sum / max : null, coverage: max / 3, count }]
    }),
  ) as AxisScores
}

/** Indicateur synthétique gauche (-1) / droite (+1). */
export function computeLeftRight(scores: Record<AxisId, number | null>): number | null {
  let sum = 0
  let total = 0
  for (const [axis, k] of Object.entries(LEFT_RIGHT_WEIGHTS) as [AxisId, number][]) {
    const s = scores[axis]
    if (s === null || s === undefined) continue
    sum += s * k
    total += k
  }
  return total > 0 ? sum / total : null
}

export function courantLeftRight(c: Courant): number {
  return computeLeftRight(c.position) ?? 0
}

/**
 * Affinité entre la personne et chaque courant :
 * distance euclidienne pondérée sur les axes renseignés, ramenée à un pourcentage.
 * `axisFactor` permet de pondérer chaque axe selon la quantité d'information disponible (résultats par thème).
 */
export function computeAffinities(
  scores: AxisScores,
  axisFactor: (axis: AxisId) => number = () => 1,
): Affinity[] {
  return COURANTS.map((courant) => {
    let num = 0
    let den = 0
    for (const a of AXES) {
      const s = scores[a.id].score
      if (s === null) continue
      const w = (courant.weights[a.id] ?? 1) * axisFactor(a.id)
      if (w <= 0) continue
      const d = s - courant.position[a.id]
      num += w * d * d
      den += w * 4 // écart maximal possible sur un axe : 2
    }
    const distance = den > 0 ? Math.sqrt(num / den) : 1
    return { courant, distance, affinity: Math.round((1 - distance) * 1000) / 10 }
  }).sort((a, b) => b.affinity - a.affinity)
}

function plainScores(scores: AxisScores): Record<AxisId, number | null> {
  return Object.fromEntries(AXES.map((a) => [a.id, scores[a.id].score])) as Record<AxisId, number | null>
}

export function computeResults(answers: Answers): Results {
  const axes = computeAxisScores(answers)
  const themes: ThemeResult[] = THEMES.map((t) => {
    const qs = QUESTIONS.filter((q) => q.theme === t.id)
    const tAxes = computeAxisScores(answers, qs)
    const maxCov = Math.max(...AXES.map((a) => tAxes[a.id].coverage), 0)
    return {
      theme: t.id,
      answered: qs.filter((q) => typeof answers[q.id] === 'number').length,
      total: qs.length,
      axes: tAxes,
      leftRight: computeLeftRight(plainScores(tAxes)),
      affinities: maxCov > 0 ? computeAffinities(tAxes, (axis) => tAxes[axis].coverage / maxCov) : [],
    }
  })
  const values = Object.values(answers)
  return {
    answered: values.filter((v) => typeof v === 'number').length,
    skipped: values.filter((v) => v === 'skip').length,
    total: QUESTIONS.length,
    axes,
    leftRight: computeLeftRight(plainScores(axes)),
    affinities: computeAffinities(axes),
    themes,
  }
}

/** Qualificatif d'intensité d'un score. */
export function intensity(score: number): string {
  const a = Math.abs(score)
  if (a < 0.1) return 'Équilibré'
  if (a < 0.35) return 'Plutôt'
  if (a < 0.65) return 'Nettement'
  return 'Très'
}

export function axisVerdict(score: number | null, neg: string, pos: string): string {
  if (score === null) return 'Non déterminé'
  const i = intensity(score)
  if (i === 'Équilibré') return `Équilibré entre ${neg.toLowerCase()} et ${pos.toLowerCase()}`
  return `${i} ${(score < 0 ? neg : pos).toLowerCase()}`
}

export function leftRightLabel(v: number | null): string {
  if (v === null) return 'Non déterminé'
  if (v <= -0.6) return 'Gauche radicale'
  if (v <= -0.3) return 'Gauche'
  if (v <= -0.1) return 'Centre gauche'
  if (v < 0.1) return 'Centre'
  if (v < 0.3) return 'Centre droit'
  if (v < 0.6) return 'Droite'
  return 'Droite radicale'
}
