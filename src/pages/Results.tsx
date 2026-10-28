import { useEffect, useMemo, useState } from 'react'
import { AXES, type AxisId } from '../data/axes'
import { THEME_BY_ID } from '../data/themes'
import { QUESTIONS, SCALE_LABEL } from '../lib/data'
import { createOrRenameSave, findSave } from '../lib/saves'
import {
  axisVerdict,
  computeResults,
  courantLeftRight,
  leftRightLabel,
  type Affinity,
  type Answers,
  type Results,
} from '../lib/scoring'
import { buildMarkdown } from '../lib/markdown'
import { decodeAnswers, shareUrl, type QuizState } from '../lib/state'
import { copyText, downloadBlob, downloadText, fileStamp } from '../lib/download'
import { canvasToBlob, drawShareImage } from '../lib/image'
import { href } from '../lib/router'
import Compass from '../components/Compass'
import { Dialog } from '../components/Layout'
import SaveDialog from '../components/SaveDialog'
import { CopyIcon, DownloadIcon, ImageIcon, LinkIcon, SaveIcon, SparkIcon } from '../components/Icons'

const pct = (n: number) => `${n.toFixed(1).replace('.', ',')} %`
const toPos = (v: number) => `${((v + 1) / 2) * 100}%`

function useToast() {
  const [msg, setMsg] = useState<string | null>(null)
  const show = (m: string) => {
    setMsg(m)
    window.setTimeout(() => setMsg(null), 2200)
  }
  return { msg, show }
}

// ---------------------------------------------------------------- Export

function ExportPanel({
  results,
  answers,
  markdown,
  axes,
  toast,
}: {
  results: Results
  answers: Answers
  markdown: () => string
  axes: [AxisId, AxisId]
  toast: (m: string) => void
}) {
  const filename = `courants-politiques-${fileStamp()}`

  const share = async () => {
    const url = shareUrl(answers)
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      try {
        await navigator.share({ title: 'Mes résultats', url })
        return
      } catch {
        /* annulé : on retombe sur la copie */
      }
    }
    if (await copyText(url)) toast('Lien de partage copié')
  }

  const image = async () => {
    const blob = await canvasToBlob(drawShareImage(results, axes[0], axes[1]))
    const file = new File([blob], `${filename}.png`, { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] }) && /Mobi|Android/i.test(navigator.userAgent)) {
      try {
        await navigator.share({ files: [file], title: 'Mon courant de pensée politique' })
        return
      } catch {
        /* annulé */
      }
    }
    downloadBlob(blob, file.name)
  }

  return (
    <section className="export" aria-labelledby="export-title">
      <div>
        <span className="feature-badge">
          <SparkIcon /> Export pour votre IA
        </span>
        <h2 id="export-title">Faites analyser vos résultats par une IA</h2>
        <p>
          Un fichier Markdown complet : contexte, méthode de calcul, vos {QUESTIONS.length} réponses avec vos
          explications, et tous les résultats. Envoyez-le à ChatGPT, Claude, Gemini, Mistral ou toute autre IA.
        </p>
      </div>
      <div className="export-actions">
        <button className="btn btn-primary btn-lg btn-block" onClick={() => downloadText(markdown(), `${filename}.md`)}>
          <DownloadIcon /> Télécharger le fichier .md
        </button>
        <div className="export-secondary">
          <button
            className="btn"
            onClick={async () => {
              if (await copyText(markdown())) toast('Texte copié, collez-le dans votre IA')
            }}
          >
            <CopyIcon />
            Copier le texte
          </button>
          <button className="btn" onClick={share}>
            <LinkIcon />
            Lien
          </button>
          <button className="btn" onClick={image}>
            <ImageIcon />
            Image
          </button>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- Spectre gauche–droite

function Spectrum({ results }: { results: Results }) {
  const lr = results.leftRight
  return (
    <div className="card card-pad">
      <h2 className="section-title">Gauche – droite</h2>
      <p className="muted" style={{ fontSize: 14 }}>
        Indicateur synthétique (économie, société, identité, autorité). Les traits indiquent la position des courants.
      </p>
      <div className="spectrum">
        <div className="spectrum-bar" />
        {results.affinities.map((a) => (
          <span
            key={a.courant.id}
            className="spectrum-tick"
            style={{ left: toPos(courantLeftRight(a.courant)) }}
            title={a.courant.name}
          />
        ))}
        {lr !== null && (
          <>
            <span className="spectrum-you-label" style={{ left: toPos(lr) }}>
              Vous · {leftRightLabel(lr)}
            </span>
            <span className="spectrum-you" style={{ left: toPos(lr) }} />
          </>
        )}
        <div className="spectrum-ends">
          <span>Gauche radicale</span>
          <span>Centre</span>
          <span>Droite radicale</span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- Axes

function AxisBars({ results }: { results: Results }) {
  const ref = results.affinities[0]?.courant
  return (
    <div className="card card-pad">
      <h2 className="section-title">Vos 9 axes</h2>
      <p className="muted" style={{ fontSize: 14, marginBottom: 18 }}>
        Point plein : vous. Cercle pointillé : {ref ? ref.name.toLowerCase() : 'courant le plus proche'}.
      </p>
      <div className="axis-list">
        {AXES.map((a) => {
          const s = results.axes[a.id].score
          const color = s === null ? 'var(--muted)' : s < 0 ? 'var(--red)' : 'var(--blue)'
          return (
            <div className="axis-row" key={a.id}>
              <h3>
                {a.name} <span>{axisVerdict(s, a.neg, a.pos)}</span>
              </h3>
              <div className="axis-track">
                {s !== null && (
                  <div
                    className="axis-fill"
                    style={{
                      left: s < 0 ? toPos(s) : '50%',
                      right: s < 0 ? '50%' : `${100 - ((s + 1) / 2) * 100}%`,
                      background: color,
                      opacity: 0.25,
                    }}
                  />
                )}
                {ref && <span className="axis-ghost" style={{ left: toPos(ref.position[a.id]) }} />}
                {s !== null && <span className="axis-marker" style={{ left: toPos(s), background: color }} />}
              </div>
              <div className="axis-poles">
                <span>{a.neg}</span>
                <span>{a.pos}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- Classement

function RankItem({ a, rank, results }: { a: Affinity; rank: number; results: Results }) {
  const c = a.courant
  return (
    <details className={`rank-item${rank < 3 ? ' top' : ''}`} open={rank === 0}>
      <summary>
        <span className="rank-num">{rank + 1}</span>
        <span className="rank-name">{c.name}</span>
        <span className="rank-pct">{pct(a.affinity)}</span>
        <span />
        <span className="rank-bar">
          <div style={{ width: `${a.affinity}%` }} />
        </span>
      </summary>
      <div className="rank-body">
        <p>{c.summary}</p>
        <div>
          <h4>Idées clés</h4>
          <ul>
            {c.ideas.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Origines</h4>
          <p>{c.origins}</p>
        </div>
        <div>
          <h4>Figures intellectuelles</h4>
          <p>{c.figures.join(' · ')}</p>
        </div>
        <div>
          <h4>Vous et ce courant</h4>
          <div className="compare">
            {AXES.map((ax) => {
              const s = results.axes[ax.id].score
              return (
                <div className="compare-row" key={ax.id}>
                  <span>{ax.name}</span>
                  <div className="compare-track">
                    <i style={{ left: toPos(c.position[ax.id]), background: 'var(--blue)', opacity: 0.85 }} />
                    {s !== null && <i style={{ left: toPos(s), background: 'var(--red)' }} />}
                  </div>
                </div>
              )
            })}
          </div>
          <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>
            <span style={{ color: 'var(--red)' }}>●</span> vous · <span style={{ color: 'var(--blue)' }}>●</span>{' '}
            {c.short}
          </p>
        </div>
      </div>
    </details>
  )
}

// ---------------------------------------------------------------- Thèmes

function ThemeCards({
  results,
  answers,
  explanations,
}: {
  results: Results
  answers: Answers
  explanations: Record<number, string>
}) {
  return (
    <div className="themes">
      {results.themes.map((t) => {
        const qs = QUESTIONS.filter((q) => q.theme === t.theme)
        return (
          <div className="card theme-card" key={t.theme}>
            <h3>{THEME_BY_ID[t.theme].name}</h3>
            <p className="theme-meta">
              {t.answered}/{t.total} questions répondues
            </p>
            {AXES.filter((a) => t.axes[a.id].score !== null)
              .sort((a, b) => t.axes[b.id].coverage - t.axes[a.id].coverage)
              .slice(0, 2)
              .map((a) => {
                const sc = t.axes[a.id].score!
                return (
                  <div className="theme-axis" key={a.id}>
                    <div className="theme-axis-head">
                      <span>{a.name}</span>
                      <strong>{axisVerdict(sc, a.neg, a.pos)}</strong>
                    </div>
                    <div className="axis-track">
                      <span className="axis-marker" style={{ left: toPos(sc), background: sc < 0 ? 'var(--red)' : 'var(--blue)' }} />
                    </div>
                    <div className="axis-poles">
                      <span>{a.neg}</span>
                      <span>{a.pos}</span>
                    </div>
                  </div>
                )
              })}
            <h4 className="theme-sub">Courants les plus proches sur ce thème</h4>
            {t.affinities.length > 0 ? (
              <ol className="theme-top">
                {t.affinities.slice(0, 3).map((a) => (
                  <li key={a.courant.id}>
                    <span>{a.courant.name}</span>
                    <span>{pct(a.affinity)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="muted">Pas assez de réponses sur ce thème.</p>
            )}
            <details className="theme-answers">
              <summary>Voir mes réponses</summary>
              <ol>
                {qs.map((q) => {
                  const v = answers[q.id]
                  return (
                    <li key={q.id}>
                      <div>{q.text}</div>
                      <span className="ans-tag">
                        {v === 'skip' ? 'Passée' : typeof v === 'number' ? SCALE_LABEL[v] : 'Sans réponse'}
                      </span>
                      {explanations[q.id]?.trim() && <div className="ans-expl">« {explanations[q.id].trim()} »</div>}
                    </li>
                  )
                })}
              </ol>
            </details>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------- Page

function ResultsView({
  answers,
  explanations,
  order,
  startedAt,
  finishedAt,
  shared,
  savedName,
  onSave,
  onRestart,
}: {
  answers: Answers
  explanations: Record<number, string>
  order: number[]
  startedAt?: string | null
  finishedAt?: string | null
  shared?: boolean
  /** Nom de la sauvegarde nommée liée à ces résultats, s'il y en a une. */
  savedName?: string
  /** Enregistre (ou renomme) la sauvegarde ; renvoie false si le stockage est indisponible. */
  onSave: (name: string) => boolean
  onRestart?: () => void
}) {
  const results = useMemo(() => computeResults(answers), [answers])
  const [axes, setAxes] = useState<[AxisId, AxisId]>(['economie', 'autorite'])
  const [confirm, setConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const top = results.affinities[0]
  const markdown = () => buildMarkdown({ answers, explanations, order, results, startedAt, finishedAt })

  return (
    <div className="container">
      {shared && (
        <div className="banner">
          <span>Résultats partagés via un lien (les explications écrites ne sont pas incluses).</span>
          <a className="btn btn-sm btn-primary" href={href.home}>
            Faire le questionnaire
          </a>
        </div>
      )}

      <header className="results-head">
        <div className="eyebrow">{shared ? 'Courant le plus proche' : 'Votre courant le plus proche'}</div>
        <h1>{top?.courant.name ?? '—'}</h1>
        <p className="lr">
          {top && (
            <>
              <strong style={{ color: 'var(--blue)' }}>{pct(top.affinity)}</strong> d’affinité ·{' '}
            </>
          )}
          {leftRightLabel(results.leftRight)} · {results.answered} réponses
          {results.skipped > 0 && `, ${results.skipped} passées`}
        </p>
        <div className="results-save">
          <button className="btn btn-sm save-btn" onClick={() => setSaving(true)}>
            <SaveIcon /> {savedName ? 'Renommer la sauvegarde' : 'Sauvegarder ces résultats'}
          </button>
          {savedName && <span className="muted">Sauvegardé sous « {savedName} »</span>}
        </div>
      </header>

      <ExportPanel results={results} answers={answers} markdown={markdown} axes={axes} toast={toast.show} />

      <section className="section">
        <div className="grid-2">
          <div>
            <h2 className="section-title">Carte des courants</h2>
            <p className="section-lead">Changez les axes pour explorer votre position sous tous les angles.</p>
            <Compass results={results} x={axes[0]} y={axes[1]} onChange={(x, y) => setAxes([x, y])} />
          </div>
          <div style={{ display: 'grid', gap: 16 }}>
            <Spectrum results={results} />
            <AxisBars results={results} />
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Affinité avec les {results.affinities.length} courants</h2>
        <p className="section-lead">
          Classement complet. Touchez un courant pour lire sa fiche et vous comparer à lui axe par axe.
        </p>
        <div className="ranking">
          {results.affinities.map((a, i) => (
            <RankItem key={a.courant.id} a={a} rank={i} results={results} />
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Votre positionnement par thème</h2>
        <p className="section-lead">
          Le même calcul, appliqué séparément aux questions de chaque thème. Vos idées ne suivent pas forcément le même
          courant partout.
        </p>
        <ThemeCards results={results} answers={answers} explanations={explanations} />
      </section>

      {!shared && onRestart && (
        <section className="section" style={{ textAlign: 'center' }}>
          <button className="btn" onClick={() => setConfirm(true)}>
            Refaire le questionnaire
          </button>
          <p className="muted" style={{ fontSize: 14, marginTop: 10 }}>
            <a href={href.method}>Comment ces résultats sont-ils calculés ?</a>
          </p>
        </section>
      )}

      {confirm && onRestart && (
        <Dialog
          title="Refaire le questionnaire ?"
          confirmLabel="Recommencer"
          onCancel={() => setConfirm(false)}
          onConfirm={() => {
            setConfirm(false)
            onRestart()
          }}
        >
          Vos réponses actuelles seront effacées. Pensez à exporter votre fichier avant.
        </Dialog>
      )}

      {saving && (
        <SaveDialog
          initialName={savedName ?? ''}
          title="Sauvegarder ces résultats"
          onCancel={() => setSaving(false)}
          onSave={(name) => {
            setSaving(false)
            toast.show(
              onSave(name)
                ? `Sauvegardé sous « ${name.trim()} »`
                : 'Impossible d’enregistrer : stockage du navigateur indisponible',
            )
          }}
        >
          {shared
            ? 'Les réponses de ce lien seront gardées dans ce navigateur (sans explications écrites, elles ne sont pas dans le lien).'
            : 'Vos réponses, explications et résultats seront gardés dans ce navigateur.'}{' '}
          Vous les retrouverez sur la page d’accueil, avec le courant obtenu et la date.
        </SaveDialog>
      )}

      {toast.msg && (
        <div className="toast" role="status">
          {toast.msg}
        </div>
      )}
    </div>
  )
}

export default function ResultsPage({
  state,
  setState,
  onRestart,
}: {
  state: QuizState
  setState: (fn: (s: QuizState | null) => QuizState | null) => void
  onRestart: () => void
}) {
  const save = (name: string) => {
    const linked = createOrRenameSave(name, state)
    if (linked) setState(() => linked)
    return !!linked
  }
  return (
    <ResultsView
      answers={state.answers}
      explanations={state.explanations}
      order={state.order}
      startedAt={state.startedAt}
      finishedAt={state.finishedAt}
      savedName={findSave(state.saveId)?.name}
      onSave={save}
      onRestart={onRestart}
    />
  )
}

export function SharedResults({ code }: { code: string }) {
  const answers = useMemo(() => decodeAnswers(code), [code])
  // Sauvegarde créée depuis ce lien : indépendante de la progression en cours du navigateur.
  const [linked, setLinked] = useState<QuizState | null>(null)
  useEffect(() => setLinked(null), [code])
  if (!answers) {
    return (
      <div className="container narrow prose">
        <h1>Lien invalide</h1>
        <p>Ce lien de résultats est incomplet ou provient d’une ancienne version du questionnaire.</p>
        <p style={{ marginTop: 20 }}>
          <a className="btn btn-primary" href={href.home}>
            Faire le questionnaire
          </a>
        </p>
      </div>
    )
  }
  const save = (name: string) => {
    const now = new Date().toISOString()
    const base: QuizState = linked ?? {
      order: QUESTIONS.map((q) => q.id).sort((a, b) => a - b),
      answers,
      explanations: {},
      index: QUESTIONS.length - 1,
      startedAt: now,
      finishedAt: now,
    }
    const saved = createOrRenameSave(name, base)
    if (saved) setLinked(saved)
    return !!saved
  }
  return (
    <ResultsView
      answers={answers}
      explanations={{}}
      order={[]}
      shared
      savedName={findSave(linked?.saveId)?.name}
      onSave={save}
    />
  )
}
