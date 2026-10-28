# Génération IUM — Questionnaire des courants politiques

100 affirmations pour situer une personne parmi 20 courants de pensée politique, sur 9 axes. Site 100 % statique : aucune donnée n'est envoyée à un serveur.

## Démarrer

```bash
npm install
npm run dev      # développement
npm run build    # production dans dist/
```

Le build est statique (`base: './'`) : le contenu de `dist/` peut être servi depuis n'importe quel dossier.

## Où modifier quoi

| Fichier | Contenu |
|---|---|
| `src/data/questions.json` | Les 100 affirmations : `theme`, `text` et `axes` (poids de -3 à +3 ; positif = être d'accord rapproche du pôle +1) |
| `src/data/courants.json` | Les 20 courants : fiche, `position` de référence sur les 9 axes (-1 à +1), `weights` des axes déterminants |
| `src/data/axes.ts` | Définition des 9 axes et pondération de l'indicateur gauche–droite |
| `src/data/themes.ts` | Les 10 thèmes |
| `src/config.ts` | Nom du site, crédits, **lien GitHub** |
| `src/lib/scoring.ts` | Calcul des scores et des affinités |
| `src/lib/markdown.ts` | Fichier exporté pour les IA |
| `src/lib/image.ts` | Image de partage (PNG 1080×1350) |
| `src/seo.ts` | Référencement : **adresse publique** (`SITE_URL`), JSON-LD, FAQ, contenu indexable sans JavaScript, `sitemap.xml`, `robots.txt` et `llms.txt` générés au build |

Si vous ajoutez ou retirez des questions, les sauvegardes en cours et les anciens liens de partage deviennent invalides (le nombre de questions est vérifié).

## Fonctionnement

- Questions mélangées à chaque passage, sans affichage du thème.
- Échelle à 7 niveaux, bouton « Passer » (question exclue du calcul) et explication facultative.
- Progression sauvegardée dans le `localStorage` du navigateur (`giq-state-v1`).
- Sauvegardes nommées (`giq-saves-v1`, voir `src/lib/saves.ts`) : bouton « Sauvegarder » pendant le questionnaire, liste sur l'accueil pour reprendre ou supprimer. Une progression reliée à une sauvegarde la met à jour à chaque réponse. Chaque sauvegarde s'exporte en fichier `.json` (format `giq-save` v1) et se réimporte depuis l'accueil, sur n'importe quel navigateur.
- Lien de partage : les réponses (pas les explications) sont encodées dans l'URL (`#/r/v1-…`).
- Raccourcis clavier : `1`–`7` répondre, `Entrée` suivant, `←` précédent, `P` passer, `E` expliquer.
# Generation.ium-Quiz
