import { useMemo, useRef, useState } from 'react'
import { AXES } from '../data/axes'
import { COURANTS, QUESTIONS } from '../lib/data'
import { href, navigate } from '../lib/router'
import type { QuizState } from '../lib/state'
import { computeResults } from '../lib/scoring'
import {
  addSave,
  deleteSave,
  exportSaveFile,
  listSaves,
  parseSaveFile,
  saveFileName,
  type NamedSave,
} from '../lib/saves'
import { downloadText } from '../lib/download'
import { SITE } from '../config'
import { Dialog } from '../components/Layout'
import { ArrowRight, DownloadIcon, SaveIcon, ShieldIcon, SparkIcon, TrashIcon, UploadIcon } from '../components/Icons'

const dateFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })

export default function Home({
  state,
  onStart,
  onLoad,
}: {
  state: QuizState | null
  onStart: () => void
  onLoad: (s: QuizState) => void
}) {
  const [confirm, setConfirm] = useState(false)
  const [saves, setSaves] = useState(listSaves)
  const [toLoad, setToLoad] = useState<NamedSave | null>(null)
  const [toDelete, setToDelete] = useState<NamedSave | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  // Courant le plus proche de chaque sauvegarde terminée, affiché dans la liste.
  const topCourant = useMemo(
    () =>
      new Map(
        saves
          .filter((s) => s.state.finishedAt)
          .map((s) => [s.id, computeResults(s.state.answers).affinities[0]?.courant.name]),
      ),
    [saves],
  )
  const answered = state ? Object.keys(state.answers).length : 0
  const inProgress = state && !state.finishedAt && answered > 0
  const finished = !!state?.finishedAt

  // La progression en cours n'est perdue que si elle n'est reliée à aucune sauvegarde nommée.
  const linked = !!state?.saveId && saves.some((s) => s.id === state.saveId)
  const unsaved = !!state && (inProgress || finished) && !linked

  const load = (save: NamedSave) => {
    if (save.id === state?.saveId) return onLoad(state)
    if (unsaved) return setToLoad(save)
    onLoad(save.state)
  }

  const importFile = async (file: File | undefined) => {
    if (!file) return
    setImportError(null)
    const parsed = parseSaveFile(await file.text().catch(() => ''))
    if ('error' in parsed) return setImportError(parsed.error)
    const entry = addSave(parsed.name, parsed.state)
    if (!entry) return setImportError('Impossible d’enregistrer : stockage du navigateur indisponible.')
    setSaves(listSaves())
    load(entry)
  }

  const restart = () => (state && (inProgress || finished) ? setConfirm(true) : onStart())

  return (
    <>
      <section className="container hero">
        <div className="eyebrow">Questionnaire politique · France</div>
        <h1>Quel courant de pensée politique vous correspond&nbsp;?</h1>
        <p className="lead">
          {QUESTIONS.length} affirmations sur les grandes questions de société. Indiquez votre degré d’accord, expliquez
          vos choix si vous le souhaitez, et découvrez où vous vous situez parmi {COURANTS.length} courants de pensée,
          du communisme au monarchisme.
        </p>

        <div className="hero-actions">
          {inProgress ? (
            <>
              <button className="btn btn-primary btn-lg" onClick={() => navigate(href.quiz)}>
                Reprendre ({answered}/{QUESTIONS.length}) <ArrowRight />
              </button>
              <button className="btn btn-lg" onClick={restart}>
                Recommencer à zéro
              </button>
            </>
          ) : finished ? (
            <>
              <button className="btn btn-primary btn-lg" onClick={() => navigate(href.results)}>
                Voir mes résultats <ArrowRight />
              </button>
              <button className="btn btn-lg" onClick={restart}>
                Refaire le questionnaire
              </button>
            </>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={onStart}>
              Commencer le questionnaire <ArrowRight />
            </button>
          )}
        </div>

        <div className="saves">
          <div className="saves-head">
            <h2>
              <SaveIcon /> Sauvegardes de ce navigateur
            </h2>
            <button className="btn btn-sm" onClick={() => fileRef.current?.click()}>
              <UploadIcon /> Importer
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                importFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </div>
          {importError && (
            <p className="saves-error" role="alert">
              {importError}
            </p>
          )}
          {saves.length === 0 ? (
            <p className="saves-empty muted">
              Aucune sauvegarde nommée. Utilisez « Sauvegarder » pendant le questionnaire, ou importez un fichier
              exporté.
            </p>
          ) : (
            <ul>
              {saves.map((s) => {
                const n = Object.keys(s.state.answers).length
                const current = s.id === state?.saveId
                return (
                  <li key={s.id} className="save-item">
                    <div className="save-info">
                      <strong>{s.name}</strong>
                      <span className="muted">
                        {s.state.finishedAt
                          ? (topCourant.get(s.id) ?? 'Terminé')
                          : `${n}/${QUESTIONS.length} réponses`}{' '}
                        ·{' '}
                        {dateFmt.format(new Date(s.savedAt))}
                        {current && !s.state.finishedAt && ' · en cours'}
                      </span>
                    </div>
                    <div className="save-actions">
                      <button className="btn btn-sm btn-primary" onClick={() => load(s)}>
                        {s.state.finishedAt ? 'Résultats' : 'Reprendre'}
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => downloadText(exportSaveFile(s), saveFileName(s), 'application/json;charset=utf-8')}
                        aria-label={`Exporter la sauvegarde ${s.name}`}
                        title="Exporter (.json)"
                      >
                        <DownloadIcon size={16} />
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => setToDelete(s)}
                        aria-label={`Supprimer la sauvegarde ${s.name}`}
                        title="Supprimer"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="stats">
          <div className="stat">
            <strong>{QUESTIONS.length}</strong>
            <span>questions</span>
          </div>
          <div className="stat">
            <strong>{COURANTS.length}</strong>
            <span>courants de pensée</span>
          </div>
          <div className="stat">
            <strong>{AXES.length}</strong>
            <span>axes d’analyse</span>
          </div>
          <div className="stat">
            <strong>~20 min</strong>
            <span>progression sauvegardée</span>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="feature">
          <div>
            <span className="feature-badge">
              <SparkIcon /> Notre fonctionnalité
            </span>
            <h2>Exportez vos résultats pour votre IA</h2>
            <p className="muted">
              À la fin du questionnaire, téléchargez un fichier Markdown complet à transmettre à l’assistant IA de votre
              choix (ChatGPT, Claude, Gemini, Mistral…). Il pourra analyser votre profil en profondeur, en tenant compte
              de chacune de vos explications.
            </p>
            <ul>
              <li>Les 100 questions, vos réponses et vos explications écrites</li>
              <li>La méthode de calcul complète et la position de chaque courant</li>
              <li>Vos scores par axe, par thème et le classement des 20 courants</li>
              <li>Des consignes pour que l’IA produise une analyse neutre et argumentée</li>
            </ul>
          </div>
          <pre className="md-preview" aria-hidden>
            <b># Réponses et résultats complets</b>
            {'\n\n'}
            <b>## 0. Instructions pour l’IA</b>
            {'\n'}Première chose à faire : écris « Les données de ton questionnaire ont bien été traitées. »{'\n\n'}
            <b>## 2. Méthode de calcul</b>
            {'\n'}score(axe) = Σ (réponse × poids) / Σ (3 × |poids|){'\n\n'}
            <b>## 3. Résultats</b>
            {'\n'}| Rang | Courant | Affinité |{'\n'}| 1 | … | 84,2 % |{'\n\n'}
            <b>#### Q42. Les lois nationales devraient…</b>
            {'\n'}- Réponse : Plutôt d’accord (+1){'\n'}- Explication : « … »
          </pre>
        </div>
      </section>

      <section className="container section">
        <h2 className="section-title">Comment ça marche</h2>
        <p className="section-lead">Un questionnaire sérieux, sans détour, centré sur les idées.</p>
        <div className="steps">
          <div className="step card">
            <div className="step-num">1</div>
            <div>
              <h3>Répondez aux affirmations</h3>
              <p>Sept niveaux d’accord, un bouton pour passer, et une case pour expliquer votre choix.</p>
            </div>
          </div>
          <div className="step card">
            <div className="step-num">2</div>
            <div>
              <h3>Sans thème ni ordre fixe</h3>
              <p>Les questions sont mélangées et leur thème n’est pas affiché, pour limiter les biais.</p>
            </div>
          </div>
          <div className="step card">
            <div className="step-num">3</div>
            <div>
              <h3>Découvrez votre carte</h3>
              <p>Boussole politique, 9 axes, résultats par thème et pourcentage d’affinité pour chaque courant.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container section">
        <h2 className="section-title">Les {COURANTS.length} courants analysés</h2>
        <p className="section-lead">
          Uniquement des courants de pensée : aucun parti, aucune personnalité politique.{' '}
          <a href={href.method}>Voir la méthodologie</a>
        </p>
        <div className="chips">
          {COURANTS.map((c) => (
            <span className="chip" key={c.id}>
              {c.name}
            </span>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="privacy">
          <ShieldIcon />
          <div>
            <strong>Vos réponses ne quittent pas votre appareil.</strong>
            <p className="muted">
              Aucun compte, aucun serveur, aucune base de données. La progression est enregistrée uniquement dans votre
              navigateur, et le code source est public.
            </p>
          </div>
        </div>
      </section>

      <div className="container">
        <a className="asso" href={SITE.associationUrl} target="_blank" rel="noreferrer">
          <img src={SITE.logo} alt="" width={237} height={144} />
          <span>
            Un questionnaire proposé par <strong>{SITE.association}</strong>
          </span>
        </a>
      </div>

      {confirm && (
        <Dialog
          title="Recommencer à zéro ?"
          confirmLabel="Recommencer"
          onCancel={() => setConfirm(false)}
          onConfirm={() => {
            setConfirm(false)
            onStart()
          }}
        >
          {linked
            ? 'Votre progression actuelle reste disponible dans vos sauvegardes.'
            : 'Vos réponses et explications actuelles seront effacées de ce navigateur.'}
        </Dialog>
      )}

      {toLoad && (
        <Dialog
          title={`Reprendre « ${toLoad.name} » ?`}
          confirmLabel="Reprendre"
          onCancel={() => setToLoad(null)}
          onConfirm={() => {
            setToLoad(null)
            onLoad(toLoad.state)
          }}
        >
          Votre progression actuelle ({answered}/{QUESTIONS.length}) n’est pas sauvegardée sous un nom : elle sera
          remplacée. Pour la garder, reprenez-la d’abord et utilisez le bouton « Sauvegarder ».
        </Dialog>
      )}

      {toDelete && (
        <Dialog
          title={`Supprimer « ${toDelete.name} » ?`}
          confirmLabel="Supprimer"
          onCancel={() => setToDelete(null)}
          onConfirm={() => {
            deleteSave(toDelete.id)
            setSaves(listSaves())
            setToDelete(null)
          }}
        >
          {toDelete.id === state?.saveId
            ? 'La sauvegarde nommée sera supprimée. La progression en cours reste ouverte dans ce navigateur.'
            : 'Les réponses et explications de cette sauvegarde seront définitivement effacées de ce navigateur.'}
        </Dialog>
      )}
    </>
  )
}
