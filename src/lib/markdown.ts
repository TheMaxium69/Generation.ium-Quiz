import { AXES, AXIS_BY_ID, LEFT_RIGHT_WEIGHTS, type AxisId } from '../data/axes'
import { THEME_BY_ID } from '../data/themes'
import { SITE } from '../config'
import { COURANTS, QUESTIONS, SCALE, SCALE_LABEL } from './data'
import { axisVerdict, courantLeftRight, leftRightLabel, type Answers, type Results } from './scoring'
import { encodeAnswers } from './state'

export interface ExportInput {
  answers: Answers
  explanations: Record<number, string>
  order: number[]
  results: Results
  startedAt?: string | null
  finishedAt?: string | null
}

const fmt = (n: number | null, digits = 2) => (n === null ? 'n/d' : (n >= 0 ? '+' : '') + n.toFixed(digits))
const pct = (n: number) => `${n.toFixed(1).replace('.', ',')} %`
const quote = (s: string) =>
  s
    .trim()
    .split('\n')
    .map((l) => `> ${l}`)
    .join('\n')
const weightsText = (axes: Partial<Record<AxisId, number>>) =>
  Object.entries(axes)
    .map(([a, w]) => `${AXIS_BY_ID[a as AxisId].name} ${w! > 0 ? '+' : ''}${w}`)
    .join(', ')

export const CONFIRMATION_PHRASE = 'Les données de ton questionnaire ont bien été traitées.'

export function buildMarkdown(input: ExportInput): string {
  const { answers, explanations, order, results } = input
  const date = new Date(input.finishedAt ?? Date.now())
  const dateStr = date.toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })
  const explained = QUESTIONS.filter((q) => explanations[q.id]?.trim()).length
  const L: string[] = []
  const p = (...lines: string[]) => L.push(...lines)

  // ---------------------------------------------------------------- En-tête et consignes
  p(
    `# ${SITE.name} — Réponses et résultats complets`,
    '',
    `> Fichier généré le ${dateStr} par le site « ${SITE.name} » (version ${SITE.version}).`,
    '> Ce document contient la totalité des questions, des réponses, des explications et des résultats calculés par le site.',
    '',
    '---',
    '',
    '## 0. Instructions pour l’IA qui lit ce fichier',
    '',
    'Bonjour. Ce fichier t’est transmis par une personne qui vient de répondre à un questionnaire politique en ligne. Elle souhaite que tu l’aides à analyser son positionnement.',
    '',
    `**Première chose à faire, avant toute autre réponse : écris exactement la phrase suivante — « ${CONFIRMATION_PHRASE} »** — afin que la personne sache que tu as bien reçu et lu l’intégralité du fichier.`,
    '',
    'Ensuite, merci de :',
    '',
    '1. **Lire tout le document** : le contexte (section 1), la méthode de calcul (section 2), les résultats du site (section 3) et chaque réponse avec son explication (section 4).',
    '2. **Juger de manière indépendante** le positionnement de la personne. Les résultats du site sont une estimation automatique fondée sur une grille simple : tu peux les confirmer, les nuancer ou les contester, à condition de justifier.',
    '3. **Accorder une grande importance aux explications écrites** : elles révèlent souvent des nuances (accord sous condition, désaccord sur la formulation, raisonnement original) que l’échelle de réponse ne capte pas.',
    '4. **Repérer les cohérences et les tensions** : réponses qui semblent contradictoires, axes où la personne se distingue fortement, thèmes où elle s’éloigne de son courant principal.',
    '5. **Proposer une synthèse** : courant(s) de pensée le(s) plus proche(s), éventuels courants hybrides, points de convergence et de divergence avec chacun, et lectures ou auteurs pour approfondir.',
    '6. **Rester neutre et respectueux** : il ne s’agit pas de juger les opinions, ni de recommander un parti ou une personnalité. Le site raisonne exclusivement en courants de pensée, jamais en partis ou en personnes.',
    '7. Si la personne te pose ensuite des questions, sers-toi de ce document comme référence.',
    '',
    '---',
    '',
    '## 1. Contexte',
    '',
    `- **Nature du site** : « ${SITE.name} », un questionnaire en ligne qui situe une personne parmi ${COURANTS.length} grands courants de pensée politique, à partir de ${QUESTIONS.length} affirmations, dans le contexte du débat public français.`,
    `- **Éditeur** : ${SITE.association}. Le questionnaire se veut strictement neutre : les résultats ne mettent en avant aucune organisation.`,
    '- **Approche** : les questions sont volontairement **abstraites** (principes, valeurs) plutôt que liées à des mesures d’actualité. Elles ne citent aucun parti ni aucune personnalité.',
    '- **Déroulement** : une affirmation à la fois, dans un **ordre aléatoire**, **sans affichage du thème** pour limiter les biais. La personne pouvait revenir en arrière, passer une question et ajouter une explication écrite facultative.',
    '- **Confidentialité** : aucune donnée n’est envoyée à un serveur. Ce fichier a été généré localement dans le navigateur de la personne, qui a choisi de te le transmettre.',
    `- **Date de début** : ${input.startedAt ? new Date(input.startedAt).toLocaleString('fr-FR') : 'n/d'} — **date de fin** : ${input.finishedAt ? new Date(input.finishedAt).toLocaleString('fr-FR') : 'n/d'}`,
    `- **Bilan** : ${results.answered} réponses données, ${results.skipped} questions passées, ${results.total - results.answered - results.skipped} sans réponse, ${explained} explications écrites.`,
    '',
    '### Échelle de réponse',
    '',
    '| Réponse | Valeur numérique |',
    '|---|---|',
    ...SCALE.map((s) => `| ${s.label} | ${s.value > 0 ? '+' : ''}${s.value} |`),
    '| Passer | exclue du calcul |',
    '',
    '---',
    '',
    '## 2. Méthode de calcul du site',
    '',
    '### 2.1 Les axes',
    '',
    `Le site mesure le positionnement sur ${AXES.length} axes indépendants, chacun noté de **-1** à **+1** :`,
    '',
    '| Axe | Pôle -1 | Pôle +1 | Ce que l’axe mesure |',
    '|---|---|---|---|',
    ...AXES.map((a) => `| ${a.name} | ${a.neg} | ${a.pos} | ${a.description} |`),
    '',
    '### 2.2 Pondération des questions',
    '',
    'Chaque affirmation porte un ou plusieurs **poids** sur certains axes (entre -3 et +3). Un poids positif signifie qu’être d’accord rapproche du pôle +1 de l’axe ; un poids négatif, du pôle -1. Les affirmations sont formulées dans les deux sens pour neutraliser la tendance à toujours approuver.',
    '',
    '### 2.3 Score d’un axe',
    '',
    '```',
    'score(axe) = Σ (réponse × poids) / Σ (3 × |poids|)',
    '```',
    '',
    'La somme porte sur les seules questions répondues (hors « passer ») qui touchent cet axe. Le résultat est compris entre -1 et +1.',
    '',
    '### 2.4 Indicateur gauche–droite',
    '',
    'Indicateur synthétique (de -1 = gauche à +1 = droite), moyenne pondérée de quatre axes :',
    '',
    ...Object.entries(LEFT_RIGHT_WEIGHTS).map(([a, k]) => `- ${AXIS_BY_ID[a as AxisId].name} : ${Math.round(k! * 100)} %`),
    '',
    'Libellés : ≤ -0,6 gauche radicale ; ≤ -0,3 gauche ; ≤ -0,1 centre gauche ; entre -0,1 et +0,1 centre ; < 0,3 centre droit ; < 0,6 droite ; au-delà droite radicale.',
    '',
    '### 2.5 Affinité avec chaque courant',
    '',
    'Chaque courant possède une **position idéale** sur les 9 axes et une **importance** par axe (les axes qui le définissent comptent davantage, par défaut 1). L’affinité est calculée par une distance euclidienne pondérée :',
    '',
    '```',
    'distance = √( Σ importance × (score_personne − position_courant)² / Σ importance × 4 )',
    'affinité = (1 − distance) × 100 %',
    '```',
    '',
    'L’écart maximal sur un axe étant de 2, une affinité de 100 % signifie une coïncidence parfaite, 0 % une opposition totale. Les pourcentages servent surtout à **classer** les courants : en pratique, un écart de quelques points entre deux courants voisins est peu significatif.',
    '',
    '### 2.6 Résultats par thème',
    '',
    'Pour chaque thème, le même calcul est appliqué aux seules questions de ce thème. Les axes sont alors pondérés selon la quantité d’information que ce thème apporte (un axe peu touché par le thème compte peu).',
    '',
    '### 2.7 Limites connues',
    '',
    '- Les positions des courants sont des **simplifications** : chaque courant recouvre une grande diversité interne.',
    '- Les questions abstraites peuvent être interprétées différemment selon les personnes ; d’où l’importance des explications écrites.',
    '- Le modèle est linéaire : il ne capte pas les positions conditionnelles (« oui, mais seulement si… »).',
    '',
    '### 2.8 Positions de référence des courants',
    '',
    `| Courant | ${AXES.map((a) => a.name).join(' | ')} | Axes déterminants |`,
    `|---|${AXES.map(() => '---').join('|')}|---|`,
    ...COURANTS.map(
      (c) =>
        `| ${c.name} | ${AXES.map((a) => fmt(c.position[a.id], 2)).join(' | ')} | ${Object.entries(c.weights)
          .map(([a, w]) => `${AXIS_BY_ID[a as AxisId].name} ×${w}`)
          .join(', ')} |`,
    ),
    '',
    '### 2.9 Description des courants',
    '',
  )
  for (const c of COURANTS) {
    p(
      `#### ${c.name}`,
      '',
      c.summary,
      '',
      `- **Idées clés** : ${c.ideas.join(' ; ')}.`,
      `- **Origines** : ${c.origins}`,
      `- **Figures intellectuelles** : ${c.figures.join(', ')}.`,
      '',
    )
  }

  // ---------------------------------------------------------------- Résultats
  p(
    '---',
    '',
    '## 3. Résultats calculés par le site',
    '',
    '### 3.1 Synthèse',
    '',
    `- **Courant le plus proche** : ${results.affinities[0]?.courant.name ?? 'n/d'} (${results.affinities[0] ? pct(results.affinities[0].affinity) : 'n/d'})`,
    `- **Puis** : ${results.affinities
      .slice(1, 4)
      .map((a) => `${a.courant.name} (${pct(a.affinity)})`)
      .join(', ')}`,
    `- **Indicateur gauche–droite** : ${fmt(results.leftRight)} → **${leftRightLabel(results.leftRight)}**`,
    '',
    '### 3.2 Scores par axe',
    '',
    '| Axe | Score (-1 à +1) | Lecture | Questions prises en compte |',
    '|---|---|---|---|',
    ...AXES.map((a) => {
      const s = results.axes[a.id]
      return `| ${a.name} (${a.neg} ↔ ${a.pos}) | ${fmt(s.score)} | ${axisVerdict(s.score, a.neg, a.pos)} | ${s.count} |`
    }),
    '',
    '### 3.3 Classement complet des courants',
    '',
    '| Rang | Courant | Affinité | Position gauche–droite du courant |',
    '|---|---|---|---|',
    ...results.affinities.map(
      (a, i) => `| ${i + 1} | ${a.courant.name} | ${pct(a.affinity)} | ${fmt(courantLeftRight(a.courant))} |`,
    ),
    '',
    '### 3.4 Résultats par thème',
    '',
  )
  for (const t of results.themes) {
    p(
      `#### ${THEME_BY_ID[t.theme].name}`,
      '',
      `- Questions répondues : ${t.answered} / ${t.total}`,
      `- Courants les plus proches sur ce thème : ${
        t.affinities.length
          ? t.affinities
              .slice(0, 5)
              .map((a) => `${a.courant.name} (${pct(a.affinity)})`)
              .join(', ')
          : 'n/d'
      }`,
      `- Axes mesurés (du plus au moins représenté dans ce thème) : ${
        AXES.filter((a) => t.axes[a.id].score !== null)
          .sort((a, b) => t.axes[b.id].coverage - t.axes[a.id].coverage)
          .map((a) => `${a.name} ${fmt(t.axes[a.id].score)} (${axisVerdict(t.axes[a.id].score, a.neg, a.pos).toLowerCase()})`)
          .join(' ; ') || 'n/d'
      }`,
      '',
    )
  }

  // ---------------------------------------------------------------- Réponses
  p(
    '---',
    '',
    '## 4. Les 100 questions et les réponses',
    '',
    'Les questions sont présentées ici **regroupées par thème** (la personne les a vues dans un ordre aléatoire, sans le thème). Pour chacune : la réponse, sa valeur, les poids de la question sur les axes, la position dans l’ordre de passage et l’explication éventuelle.',
    '',
  )
  for (const theme of Object.values(THEME_BY_ID)) {
    p(`### ${theme.name}`, '')
    for (const q of QUESTIONS.filter((x) => x.theme === theme.id)) {
      const v = answers[q.id]
      const answerText =
        v === 'skip'
          ? 'Question passée'
          : typeof v === 'number'
            ? `${SCALE_LABEL[v]} (${v > 0 ? '+' : ''}${v})`
            : 'Sans réponse'
      const rank = order.indexOf(q.id)
      p(
        `#### Q${q.id}. ${q.text}`,
        '',
        `- **Réponse** : ${answerText}`,
        `- **Aide affichée sur le site** : ${q.help.explain} D’accord = ${q.help.agree} Pas d’accord = ${q.help.disagree}`,
        `- **Poids sur les axes** : ${weightsText(q.axes)}`,
        `- **Ordre de passage** : ${rank >= 0 ? `${rank === 0 ? '1re' : `${rank + 1}e`} question` : 'n/d'}`,
      )
      const e = explanations[q.id]?.trim()
      p(e ? `- **Explication de la personne** :\n\n${quote(e)}` : '- **Explication** : aucune', '')
    }
  }

  // ---------------------------------------------------------------- Annexe brute
  const raw = {
    site: SITE.name,
    version: SITE.version,
    generatedAt: new Date().toISOString(),
    startedAt: input.startedAt ?? null,
    finishedAt: input.finishedAt ?? null,
    shareCode: encodeAnswers(answers),
    leftRight: results.leftRight,
    axes: Object.fromEntries(AXES.map((a) => [a.id, results.axes[a.id].score])),
    ranking: results.affinities.map((a) => ({ courant: a.courant.id, affinity: a.affinity })),
    answers: [...QUESTIONS]
      .sort((a, b) => a.id - b.id)
      .map((q) => ({
        id: q.id,
        theme: q.theme,
        text: q.text,
        help: q.help,
        weights: q.axes,
        answer: answers[q.id] ?? null,
        explanation: explanations[q.id]?.trim() || null,
        position: order.indexOf(q.id) + 1 || null,
      })),
  }
  p(
    '---',
    '',
    '## 5. Annexe : données brutes (JSON)',
    '',
    'Mêmes informations au format structuré, pour un traitement automatique. `answer` vaut de -3 à +3, `"skip"` si passée, `null` si sans réponse.',
    '',
    '```json',
    JSON.stringify(raw, null, 2),
    '```',
    '',
    '---',
    '',
    `Rappel pour l’IA : commence ta réponse par « ${CONFIRMATION_PHRASE} », puis propose ton analyse.`,
    '',
  )
  return L.join('\n')
}
