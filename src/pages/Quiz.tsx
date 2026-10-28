import { useCallback, useEffect, useRef, useState } from 'react'
import { QUESTION_BY_ID, SCALE } from '../lib/data'
import { href, navigate } from '../lib/router'
import type { QuizState } from '../lib/state'
import { createOrRenameSave, findSave } from '../lib/saves'
import SaveDialog from '../components/SaveDialog'
import type { AnswerValue } from '../lib/scoring'
import { ArrowLeft, ArrowRight, SaveIcon } from '../components/Icons'

/** Couleur de chaque niveau : bleu pour l'accord, rouge pour le désaccord. */
const SCALE_COLOR: Record<number, string> = {
  3: '#1d3f8f',
  2: '#3a5fb4',
  1: '#6f8fd0',
  0: '#94a3b8',
  [-1]: '#e0838d',
  [-2]: '#d4505f',
  [-3]: '#c8283a',
}

const AUTO_KEY = 'giq-auto-advance'
const MAX_EXPLANATION = 2000

function readAuto() {
  try {
    return localStorage.getItem(AUTO_KEY) === '1'
  } catch {
    return false
  }
}

export default function Quiz({
  state,
  setState,
}: {
  state: QuizState
  setState: (fn: (s: QuizState | null) => QuizState | null) => void
}) {
  const total = state.order.length
  const index = Math.min(state.index, total - 1)
  const qid = state.order[index]
  const question = QUESTION_BY_ID.get(qid)!
  const answer = state.answers[qid]
  const explanation = state.explanations[qid] ?? ''
  const answeredCount = Object.keys(state.answers).length
  const isLast = index === total - 1
  const [auto, setAuto] = useState(readAuto)
  const timer = useRef<number | undefined>(undefined)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const helpRef = useRef<HTMLDetailsElement>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const savedName = findSave(state.saveId)?.name

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const update = useCallback(
    (fn: (s: QuizState) => QuizState) => setState((s) => (s ? fn(s) : s)),
    [setState],
  )

  const goTo = useCallback(
    (i: number) => {
      window.clearTimeout(timer.current)
      update((s) => ({ ...s, index: Math.max(0, Math.min(total - 1, i)) }))
      window.scrollTo({ top: 0 })
    },
    [update, total],
  )

  const finish = useCallback(() => {
    update((s) => ({ ...s, finishedAt: s.finishedAt ?? new Date().toISOString() }))
    navigate(href.results)
  }, [update])

  const next = useCallback(() => {
    if (isLast) finish()
    else goTo(index + 1)
  }, [isLast, finish, goTo, index])

  const choose = useCallback(
    (v: AnswerValue) => {
      update((s) => ({ ...s, answers: { ...s.answers, [qid]: v } }))
      const typing = document.activeElement === textRef.current || explanation.trim().length > 0
      if (v === 'skip' || (auto && !typing)) {
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(next, v === 'skip' ? 0 : 260)
      }
    },
    [update, qid, auto, explanation, next],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const inText = document.activeElement === textRef.current
      if (inText) {
        if (e.key === 'Escape') textRef.current?.blur()
        return
      }
      // e.code désigne la touche physique : sur AZERTY, « & é " ' ( § è » (ou « - » sur PC) valent 1 à 7.
      const digit = /^(?:Digit|Numpad)([1-7])$/.exec(e.code)?.[1] ?? (e.key >= '1' && e.key <= '7' ? e.key : null)
      if (digit) {
        e.preventDefault()
        choose(SCALE[Number(digit) - 1].value)
      } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
        if (answer !== undefined) {
          e.preventDefault()
          next()
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault()
        goTo(index - 1)
      } else if (e.key.toLowerCase() === 'p') {
        choose('skip')
      } else if (e.key.toLowerCase() === 'h') {
        if (helpRef.current) helpRef.current.open = !helpRef.current.open
      } else if (e.key.toLowerCase() === 'e') {
        e.preventDefault()
        textRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [choose, next, goTo, index, answer])

  const showToast = (m: string) => {
    setToast(m)
    window.setTimeout(() => setToast(null), 2600)
  }

  const save = (name: string) => {
    const linked = createOrRenameSave(name, state)
    setSaving(false)
    if (!linked) return showToast('Impossible d’enregistrer : stockage du navigateur indisponible')
    setState(() => linked)
    showToast(`Sauvegardé sous « ${name.trim()} »`)
  }

  const toggleAuto = (v: boolean) => {
    setAuto(v)
    try {
      localStorage.setItem(AUTO_KEY, v ? '1' : '0')
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="container narrow quiz">
      <div className="quiz-top">
        <span>
          Question <strong style={{ color: 'var(--ink)' }}>{index + 1}</strong> / {total}
        </span>
        <div className="quiz-top-actions">
          <label className="toggle">
            <input type="checkbox" checked={auto} onChange={(e) => toggleAuto(e.target.checked)} />
            Avance auto
          </label>
          <button
            className="btn btn-sm save-btn"
            onClick={() => setSaving(true)}
            aria-label={savedName ? `Renommer la sauvegarde ${savedName}` : 'Sauvegarder ma progression'}
          >
            <SaveIcon /> <span className="save-btn-label">{savedName ? 'Sauvegardé' : 'Sauvegarder'}</span>
          </button>
        </div>
      </div>
      {savedName && (
        <p className="save-note">
          Sauvegarde « {savedName} » · mise à jour à chaque réponse
        </p>
      )}
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={answeredCount}>
        <div style={{ width: `${(answeredCount / total) * 100}%` }} />
      </div>

      <h1 className="statement" key={qid}>
        {question.text}
      </h1>

      <details className="qhelp" key={`help-${qid}`} ref={helpRef}>
        <summary>Comprendre la question</summary>
        <div className="qhelp-body">
          <p>{question.help.explain}</p>
          <dl>
            <dt>Être d’accord, c’est plutôt penser que…</dt>
            <dd>{question.help.agree}</dd>
            <dt>Ne pas être d’accord, c’est plutôt penser que…</dt>
            <dd>{question.help.disagree}</dd>
          </dl>
        </div>
      </details>

      <div className="scale" role="group" aria-label="Votre degré d'accord">
        {SCALE.map((s, i) => (
          <button
            key={s.value}
            className="opt"
            style={{ ['--c' as string]: SCALE_COLOR[s.value] }}
            aria-pressed={answer === s.value}
            onClick={() => choose(s.value)}
          >
            <span className="opt-dot" />
            <span className="opt-label">{s.label}</span>
            <span className="opt-key">{i + 1}</span>
          </button>
        ))}
      </div>

      {answer === 'skip' && <p className="skipped-note">Question passée : elle ne compte pas dans le calcul.</p>}

      <div className="explain">
        <label htmlFor="explain">
          Expliquer mon choix <span>facultatif</span>
        </label>
        <textarea
          id="explain"
          ref={textRef}
          value={explanation}
          maxLength={MAX_EXPLANATION}
          placeholder="Nuances, conditions, raisonnement… Ces précisions seront transmises à votre IA."
          onChange={(e) =>
            update((s) => ({ ...s, explanations: { ...s.explanations, [qid]: e.target.value } }))
          }
        />
      </div>

      <p className="kbd-hint">
        Raccourcis : <b>1–7</b> répondre · <b>Entrée</b> suivant · <b>←</b> précédent · <b>P</b> passer · <b>H</b> comprendre la
        question · <b>E</b> expliquer
      </p>

      <div className="quiz-bar">
        <div className="container narrow quiz-bar-inner">
          <button className="btn" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="Question précédente">
            <ArrowLeft />
          </button>
          <button className="btn" onClick={() => choose('skip')}>
            Passer
          </button>
          <button className="btn btn-primary" onClick={next} disabled={answer === undefined}>
            {isLast ? 'Voir mes résultats' : 'Suivant'} {!isLast && <ArrowRight />}
          </button>
        </div>
      </div>

      {saving && (
        <SaveDialog
          initialName={savedName ?? ''}
          title="Sauvegarder ma progression"
          onCancel={() => setSaving(false)}
          onSave={save}
        >
          {answeredCount}/{total} réponses, explications comprises. La sauvegarde reste dans ce navigateur et se met à
          jour à chaque réponse. Vous la retrouverez sur la page d’accueil.
        </SaveDialog>
      )}
      {toast && (
        <div className="toast toast-quiz" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
