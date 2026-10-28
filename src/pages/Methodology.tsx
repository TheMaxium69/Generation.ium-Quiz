import { AXES, AXIS_BY_ID, LEFT_RIGHT_WEIGHTS, type AxisId } from '../data/axes'
import { THEMES } from '../data/themes'
import { COURANTS, QUESTIONS, SCALE } from '../lib/data'
import { SITE } from '../config'

const fmt = (n: number) => (n > 0 ? '+' : '') + n.toFixed(2).replace('.', ',')

export default function Methodology() {
  return (
    <article className="container prose" style={{ maxWidth: 860 }}>
      <div className="eyebrow">Transparence</div>
      <h1>Méthodologie</h1>
      <p>
        Ce questionnaire situe une personne parmi {COURANTS.length} courants de pensée politique à partir de{' '}
        {QUESTIONS.length} affirmations. Il ne fait référence à aucun parti ni à aucune personnalité : seules les idées
        comptent. Le calcul est entièrement réalisé dans votre navigateur et le code est{' '}
        <a href={SITE.githubUrl} target="_blank" rel="noreferrer">
          public
        </a>
        .
      </p>

      <h2>Les questions</h2>
      <p>
        Les {QUESTIONS.length} affirmations sont réparties en {THEMES.length} thèmes (
        {THEMES.map((t) => t.name.toLowerCase()).join(', ')}). Elles sont volontairement formulées comme des principes
        plutôt que comme des mesures d’actualité, et rédigées tantôt dans un sens, tantôt dans l’autre pour neutraliser
        la tendance à approuver systématiquement.
      </p>
      <p>
        Elles sont présentées une par une, dans un ordre aléatoire propre à chaque passage, sans affichage du thème. On
        peut revenir en arrière, passer une question (elle est alors exclue du calcul) et expliquer son choix.
      </p>

      <h2>L’échelle de réponse</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Réponse</th>
              <th>Valeur</th>
            </tr>
          </thead>
          <tbody>
            {SCALE.map((s) => (
              <tr key={s.value}>
                <td>{s.label}</td>
                <td className="num">{s.value > 0 ? `+${s.value}` : s.value}</td>
              </tr>
            ))}
            <tr>
              <td>Passer</td>
              <td className="num">exclue</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Les {AXES.length} axes</h2>
      <p>Chaque axe va de -1 à +1. Ils sont mesurés indépendamment les uns des autres.</p>
      <ul>
        {AXES.map((a) => (
          <li key={a.id} style={{ marginTop: 8 }}>
            <strong>
              {a.name} ({a.neg} ↔ {a.pos})
            </strong>{' '}
            : {a.description}
          </li>
        ))}
      </ul>

      <h2>Le calcul d’un axe</h2>
      <p>
        Chaque affirmation porte un poids sur un ou plusieurs axes, entre -3 et +3. Un poids positif signifie qu’être
        d’accord rapproche du pôle +1. Le score d’un axe est la somme des réponses multipliées par les poids, divisée par
        le maximum possible :
      </p>
      <pre>score(axe) = Σ (réponse × poids) / Σ (3 × |poids|)</pre>

      <h2>L’indicateur gauche–droite</h2>
      <p>
        C’est une moyenne pondérée de quatre axes :{' '}
        {Object.entries(LEFT_RIGHT_WEIGHTS)
          .map(([a, k]) => `${AXIS_BY_ID[a as AxisId].name.toLowerCase()} (${Math.round(k! * 100)} %)`)
          .join(', ')}
        . Il reste une simplification : le clivage gauche–droite ne résume pas à lui seul une pensée politique, d’où la
        présence des autres axes.
      </p>

      <h2>L’affinité avec un courant</h2>
      <p>
        Chaque courant a une position de référence sur les 9 axes, et certains axes comptent davantage pour lui (par
        exemple, l’axe Pouvoir pour la technocratie ou l’axe Territoire pour le régionalisme). L’affinité se déduit
        d’une distance euclidienne pondérée :
      </p>
      <pre>
        {`distance = √( Σ importance × (vous − courant)² / Σ importance × 4 )
affinité = (1 − distance) × 100 %`}
      </pre>
      <p>
        100 % signifie une coïncidence parfaite, 0 % une opposition complète. Les pourcentages servent avant tout à
        classer les courants : quelques points d’écart entre deux courants voisins sont peu significatifs.
      </p>
      <p>
        Les résultats par thème appliquent le même calcul aux seules questions du thème, en pondérant chaque axe par la
        quantité d’information que le thème apporte.
      </p>

      <h2>Positions de référence des courants</h2>
      <p>Valeurs de -1 à +1. Un astérisque signale un axe déterminant pour le courant.</p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Courant</th>
              {AXES.map((a) => (
                <th key={a.id}>{a.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COURANTS.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                {AXES.map((a) => (
                  <td key={a.id} className="num">
                    {fmt(c.position[a.id])}
                    {c.weights[a.id] ? '*' : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Limites</h2>
      <ul>
        <li>Chaque courant recouvre une grande diversité interne ; sa position de référence est une simplification.</li>
        <li>Des affirmations abstraites peuvent être comprises différemment selon les personnes.</li>
        <li>Le modèle est linéaire et ne capte pas les positions conditionnelles. Les explications écrites, transmises dans l’export pour IA, sont là pour combler cette limite.</li>
      </ul>

      <h2>Confidentialité</h2>
      <p>
        Aucune donnée n’est envoyée à un serveur. La progression est stockée dans le stockage local de votre navigateur.
        Le lien de partage contient vos réponses encodées dans l’adresse, mais jamais vos explications.
      </p>
    </article>
  )
}
