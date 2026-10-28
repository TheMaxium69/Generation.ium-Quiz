import { QUESTIONS } from './data'
import type { QuizState } from './state'
import type { AnswerValue } from './scoring'

/** Sauvegarde nommée, conservée uniquement dans le navigateur. */
export interface NamedSave {
  id: string
  name: string
  savedAt: string
  state: QuizState
}

const KEY = 'giq-saves-v1'
export const MAX_SAVE_NAME = 40

export function listSaves(): NamedSave[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const saves = JSON.parse(raw) as NamedSave[]
    if (!Array.isArray(saves)) return []
    // Une sauvegarde faite avec un autre jeu de questions ne peut pas être reprise.
    return saves
      .filter((s) => Array.isArray(s.state?.order) && s.state.order.length === QUESTIONS.length)
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
  } catch {
    return []
  }
}

function writeSaves(saves: NamedSave[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(saves))
    return true
  } catch {
    return false
  }
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

/** Crée ou renomme la sauvegarde liée à cette progression. Renvoie l'état relié à la sauvegarde. */
export function createOrRenameSave(name: string, state: QuizState): QuizState | null {
  const saves = listSaves()
  const id = state.saveId && saves.some((s) => s.id === state.saveId) ? state.saveId : newId()
  const linked: QuizState = { ...state, saveId: id }
  const entry: NamedSave = { id, name: name.trim().slice(0, MAX_SAVE_NAME), savedAt: new Date().toISOString(), state: linked }
  return writeSaves([entry, ...saves.filter((s) => s.id !== id)]) ? linked : null
}

/** Met à jour la sauvegarde liée, si elle existe encore. Appelé à chaque réponse. */
export function syncSave(state: QuizState) {
  if (!state.saveId) return
  const saves = listSaves()
  const entry = saves.find((s) => s.id === state.saveId)
  if (!entry) return
  entry.state = state
  entry.savedAt = new Date().toISOString()
  writeSaves(saves)
}

/** Ajoute une sauvegarde (import d'un fichier) sous un nouvel identifiant. */
export function addSave(name: string, state: QuizState): NamedSave | null {
  const id = newId()
  const entry: NamedSave = {
    id,
    name: name.trim().slice(0, MAX_SAVE_NAME) || 'Sauvegarde importée',
    savedAt: new Date().toISOString(),
    state: { ...state, saveId: id },
  }
  return writeSaves([entry, ...listSaves()]) ? entry : null
}

export function deleteSave(id: string) {
  writeSaves(listSaves().filter((s) => s.id !== id))
}

export function findSave(id: string | undefined) {
  return id ? listSaves().find((s) => s.id === id) : undefined
}

// ---- Fichier de sauvegarde : export et import JSON, entièrement dans le navigateur. ----

const FILE_FORMAT = 'giq-save'
const FILE_VERSION = 1

export function exportSaveFile(save: NamedSave): string {
  const { saveId: _, ...state } = save.state
  return JSON.stringify(
    { format: FILE_FORMAT, version: FILE_VERSION, name: save.name, savedAt: save.savedAt, state },
    null,
    2,
  )
}

export function saveFileName(save: NamedSave) {
  const slug =
    save.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'sauvegarde'
  return `courants-politiques-${slug}.json`
}

/** Lit un fichier exporté. Renvoie un message d'erreur lisible si le contenu n'est pas valide. */
export function parseSaveFile(text: string): { name: string; state: QuizState } | { error: string } {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { error: 'Ce fichier n’est pas un JSON valide.' }
  }
  const d = data as { format?: unknown; version?: unknown; name?: unknown; state?: Partial<QuizState> }
  if (d?.format !== FILE_FORMAT || !d.state) return { error: 'Ce fichier n’est pas une sauvegarde du questionnaire.' }
  if (d.version !== FILE_VERSION) return { error: 'Cette sauvegarde vient d’une version incompatible du site.' }

  const st = d.state
  const ids = new Set(QUESTIONS.map((q) => q.id))
  const order = Array.isArray(st.order) ? st.order : []
  if (order.length !== ids.size || new Set(order).size !== ids.size || !order.every((id) => ids.has(id)))
    return { error: 'Les questions de cette sauvegarde ne correspondent pas à la version actuelle du site.' }

  const answers: Record<number, AnswerValue> = {}
  for (const [k, v] of Object.entries(st.answers ?? {})) {
    const id = Number(k)
    if (!ids.has(id) || !(v === 'skip' || (typeof v === 'number' && Number.isInteger(v) && v >= -3 && v <= 3)))
      return { error: 'Cette sauvegarde contient des réponses invalides.' }
    answers[id] = v as AnswerValue
  }
  const explanations: Record<number, string> = {}
  for (const [k, v] of Object.entries(st.explanations ?? {})) {
    if (ids.has(Number(k)) && typeof v === 'string') explanations[Number(k)] = v.slice(0, 2000)
  }

  const index = Number.isInteger(st.index) ? Math.max(0, Math.min(order.length - 1, st.index!)) : 0
  const finished = typeof st.finishedAt === 'string' && Object.keys(answers).length === order.length
  return {
    name: typeof d.name === 'string' ? d.name : '',
    state: {
      order,
      answers,
      explanations,
      index,
      startedAt: typeof st.startedAt === 'string' ? st.startedAt : new Date().toISOString(),
      finishedAt: finished ? st.finishedAt! : null,
    },
  }
}
