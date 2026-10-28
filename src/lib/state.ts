import { QUESTIONS } from './data'
import type { AnswerValue, Answers } from './scoring'

export interface QuizState {
  /** Ordre (mélangé) des identifiants de questions. */
  order: number[]
  answers: Answers
  explanations: Record<number, string>
  index: number
  startedAt: string
  finishedAt: string | null
  /** Sauvegarde nommée à laquelle cette progression est reliée (voir saves.ts). */
  saveId?: string
}

const KEY = 'giq-state-v1'

function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function newState(): QuizState {
  return {
    order: shuffle(QUESTIONS.map((q) => q.id)),
    answers: {},
    explanations: {},
    index: 0,
    startedAt: new Date().toISOString(),
    finishedAt: null,
  }
}

export function loadState(): QuizState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as QuizState
    // Le jeu de questions a changé : on ne peut pas reprendre.
    if (!Array.isArray(s.order) || s.order.length !== QUESTIONS.length) return null
    return s
  } catch {
    return null
  }
}

export function saveState(s: QuizState | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s))
    else localStorage.removeItem(KEY)
  } catch {
    /* stockage indisponible : on continue sans sauvegarde */
  }
}

// ---- Lien de partage : les réponses sont encodées dans l'URL, rien n'est envoyé nulle part. ----

const SHARE_VERSION = 'v1'

export function encodeAnswers(answers: Answers): string {
  const body = [...QUESTIONS]
    .sort((a, b) => a.id - b.id)
    .map((q) => {
      const v = answers[q.id]
      if (v === 'skip') return 'x'
      if (typeof v === 'number') return String(v + 3)
      return '_'
    })
    .join('')
  return `${SHARE_VERSION}-${body}`
}

export function decodeAnswers(code: string): Answers | null {
  const [version, body] = code.split('-')
  const sorted = [...QUESTIONS].sort((a, b) => a.id - b.id)
  if (version !== SHARE_VERSION || !body || body.length !== sorted.length) return null
  const answers: Answers = {}
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    let v: AnswerValue | undefined
    if (ch === 'x') v = 'skip'
    else if (ch >= '0' && ch <= '6') v = Number(ch) - 3
    else if (ch !== '_') return null
    if (v !== undefined) answers[sorted[i].id] = v
  }
  return answers
}

export function shareUrl(answers: Answers): string {
  const base = window.location.href.split('#')[0]
  return `${base}#/r/${encodeAnswers(answers)}`
}
