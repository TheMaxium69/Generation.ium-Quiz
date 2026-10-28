// Référencement (SEO et moteurs de réponse IA) : généré au build à partir des données du questionnaire,
// pour que le contenu reste toujours synchronisé avec les questions, axes et courants.
import type { Plugin } from 'vite'
import { AXES } from './data/axes'
import { THEMES } from './data/themes'
import courantsJson from './data/courants.json'
import questionsJson from './data/questions.json'

/** Adresse publique du questionnaire (avec / final). */
export const SITE_URL = 'https://quiz.generation-ium.fr/'
const ASSO_URL = 'https://www.generation-ium.fr/'
const ASSO_SAME_AS = [
  'https://x.com/GenerationIUM',
  'https://www.instagram.com/generation.ium/',
  'https://www.linkedin.com/company/g%C3%A9n%C3%A9ration-ium/',
]

const COURANTS = courantsJson as { id: string; name: string; summary: string; ideas: string[] }[]
const NQ = questionsJson.length
const NC = COURANTS.length
const NA = AXES.length

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const courantList = COURANTS.map((c) => c.name).join(', ')

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Comment fonctionne ce test politique ?',
    a: `Vous indiquez votre degré d'accord avec ${NQ} affirmations sur une échelle à 7 niveaux, avec la possibilité de passer une question ou d'expliquer votre choix. Le questionnaire calcule votre position sur ${NA} axes (économie, autorité, société, souveraineté, environnement, identité, méthode, territoire, pouvoir), un indicateur gauche–droite et votre pourcentage d'affinité avec ${NC} courants de pensée politique.`,
  },
  {
    q: 'Mes réponses sont-elles collectées ?',
    a: "Non. Aucun compte, aucun serveur, aucune base de données : le calcul est entièrement réalisé dans votre navigateur et la progression n'est enregistrée que sur votre appareil.",
  },
  {
    q: 'Combien de temps dure le questionnaire ?',
    a: 'Environ 20 minutes. La progression est sauvegardée automatiquement : vous pouvez vous arrêter et reprendre plus tard.',
  },
  {
    q: 'Le questionnaire est-il neutre ?',
    a: "Il ne fait référence à aucun parti ni à aucune personnalité politique : seules les idées comptent. Les affirmations sont mélangées à chaque passage, sans affichage du thème, et rédigées tantôt dans un sens, tantôt dans l'autre pour limiter les biais. La méthode de calcul est publique.",
  },
  {
    q: 'Quels courants politiques sont analysés ?',
    a: `Les ${NC} courants de pensée sont : ${courantList}.`,
  },
  {
    q: 'Puis-je faire analyser mes résultats par une IA ?',
    a: "Oui. À la fin, vous pouvez télécharger un fichier Markdown complet (questions, réponses, explications, méthode et scores) à transmettre à l'assistant IA de votre choix, comme ChatGPT, Claude, Gemini ou Mistral.",
  },
  {
    q: 'Qui propose ce questionnaire ?',
    a: "Le questionnaire est proposé gratuitement par Génération IUM, mouvement politique français de la nouvelle génération, et développé par Tyrolium. Il est sans inscription et sans publicité.",
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': ['Organization', 'PoliticalParty'],
      '@id': `${ASSO_URL}#organisation`,
      name: 'Génération IUM',
      url: ASSO_URL,
      logo: `${SITE_URL}icon-512.png`,
      sameAs: ASSO_SAME_AS,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}#site`,
      url: SITE_URL,
      name: 'Questionnaire des courants politiques',
      alternateName: ['Test politique Génération IUM', 'Quiz politique Génération IUM'],
      inLanguage: 'fr-FR',
      publisher: { '@id': `${ASSO_URL}#organisation` },
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}#app`,
      name: 'Questionnaire des courants politiques',
      url: SITE_URL,
      description: `Test politique gratuit et anonyme : ${NQ} affirmations pour se situer parmi ${NC} courants de pensée politique sur ${NA} axes.`,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Tous (navigateur web)',
      inLanguage: 'fr-FR',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      image: `${SITE_URL}og-image.jpg`,
      featureList: [
        `${NQ} affirmations sur ${THEMES.length} thèmes`,
        `Affinité avec ${NC} courants de pensée`,
        `${NA} axes d'analyse et boussole politique`,
        'Résultats par thème',
        'Export Markdown pour assistant IA',
        'Aucune donnée collectée',
      ],
      publisher: { '@id': `${ASSO_URL}#organisation` },
      isPartOf: { '@id': `${SITE_URL}#site` },
    },
    {
      '@type': 'DefinedTermSet',
      '@id': `${SITE_URL}#courants`,
      name: `Les ${NC} courants de pensée politique du questionnaire`,
      hasDefinedTerm: COURANTS.map((c) => ({
        '@type': 'DefinedTerm',
        '@id': `${SITE_URL}#courant-${c.id}`,
        name: c.name,
        description: c.summary,
      })),
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}#faq`,
      mainEntity: FAQ.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ],
}

/** Contenu lisible sans JavaScript (robots, moteurs IA), remplacé par l'application au chargement. */
function staticContent() {
  return `
      <main class="container prose" style="max-width: 860px">
        <div class="eyebrow">Questionnaire politique · France</div>
        <h1>Quel courant de pensée politique vous correspond&nbsp;?</h1>
        <p>${NQ} affirmations sur les grandes questions de société. Indiquez votre degré d’accord et découvrez où vous vous situez parmi ${NC} courants de pensée, sur ${NA} axes. Gratuit, sans inscription, aucune donnée collectée.</p>
        <p><a class="btn btn-primary btn-lg" href="#/questionnaire">Commencer le questionnaire</a></p>
        <h2>Les ${NC} courants de pensée analysés</h2>
        <dl>
${COURANTS.map((c) => `          <dt><strong>${esc(c.name)}</strong></dt><dd>${esc(c.summary)}</dd>`).join('\n')}
        </dl>
        <h2>Les ${NA} axes d’analyse</h2>
        <ul>
${AXES.map((a) => `          <li><strong>${esc(a.name)} (${esc(a.neg)} ↔ ${esc(a.pos)})</strong> : ${esc(a.description)}</li>`).join('\n')}
        </ul>
        <h2>Les ${THEMES.length} thèmes abordés</h2>
        <p>${THEMES.map((t) => esc(t.name)).join(' · ')}</p>
        <h2>Questions fréquentes</h2>
${FAQ.map((f) => `        <h3>${esc(f.q)}</h3>\n        <p>${esc(f.a)}</p>`).join('\n')}
        <p>Un questionnaire proposé par <a href="${ASSO_URL}">Génération IUM</a>.</p>
      </main>
    `
}

function llmsTxt() {
  return `# Questionnaire des courants politiques (Génération IUM)

> Test politique gratuit, anonyme et sans inscription, proposé par Génération IUM : ${NQ} affirmations pour se situer parmi ${NC} courants de pensée politique et sur ${NA} axes. Aucun parti ni personnalité n'est cité : seules les idées comptent. Le calcul est fait dans le navigateur et aucune réponse n'est envoyée à un serveur.

## Faits clés

- Adresse : ${SITE_URL}
- Éditeur : Génération IUM (${ASSO_URL}), développé par Tyrolium
- Format : ${NQ} affirmations, échelle d'accord à 7 niveaux, possibilité de passer et d'expliquer chaque réponse
- Durée : environ 20 minutes, progression sauvegardée sur l'appareil
- Résultats : affinité en % avec ${NC} courants, position sur ${NA} axes, boussole politique, indicateur gauche–droite, résultats par thème
- Export : fichier Markdown complet à transmettre à un assistant IA (ChatGPT, Claude, Gemini, Mistral…)
- Confidentialité : aucun compte, aucun serveur, aucune base de données

## Courants de pensée

${COURANTS.map((c) => `- ${c.name} : ${c.summary}`).join('\n')}

## Axes d'analyse

${AXES.map((a) => `- ${a.name} (${a.neg} ↔ ${a.pos}) : ${a.description}`).join('\n')}

## Thèmes

${THEMES.map((t) => `- ${t.name}`).join('\n')}

## Questions fréquentes

${FAQ.map((f) => `### ${f.q}\n\n${f.a}`).join('\n\n')}

## Pages

- [Questionnaire](${SITE_URL}) : accueil et démarrage du test
- [Méthodologie](${SITE_URL}#/methodologie) : formules de calcul, positions de référence des courants
- [Génération IUM](${ASSO_URL}) : le mouvement qui propose le questionnaire
`
}

function robotsTxt() {
  return `User-agent: *
Allow: /

# Moteurs de réponse et assistants IA : accès autorisé (GEO)
User-agent: GPTBot
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: ClaudeBot
User-agent: Claude-SearchBot
User-agent: Claude-User
User-agent: PerplexityBot
User-agent: Perplexity-User
User-agent: Google-Extended
User-agent: Applebot-Extended
User-agent: Bingbot
User-agent: MistralAI-User
User-agent: CCBot
Allow: /

Sitemap: ${SITE_URL}sitemap.xml
`
}

function sitemapXml() {
  const today = new Date().toISOString().slice(0, 10)
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE_URL}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>${SITE_URL}og-image.jpg</image:loc>
    </image:image>
  </url>
</urlset>
`
}

export function seoPlugin(): Plugin {
  return {
    name: 'giq-seo',
    transformIndexHtml(html) {
      return html
        .replace('<div id="root"></div>', `<div id="root">${staticContent()}</div>`)
        .replace(
          '</head>',
          `  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>\n  </head>`,
        )
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: llmsTxt() })
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt() })
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml() })
    },
  }
}
