export type AxisId =
  | 'economie'
  | 'autorite'
  | 'societe'
  | 'souverainete'
  | 'environnement'
  | 'identite'
  | 'methode'
  | 'territoire'
  | 'pouvoir'

export interface Axis {
  id: AxisId
  name: string
  /** Pôle à -1 */
  neg: string
  /** Pôle à +1 */
  pos: string
  description: string
}

export const AXES: Axis[] = [
  {
    id: 'economie',
    name: 'Économie',
    neg: 'Collectivisme',
    pos: 'Libre marché',
    description:
      "Qui doit organiser la production et la répartition des richesses : la collectivité (propriété commune, planification, redistribution) ou le marché (propriété privée, concurrence, liberté d'entreprendre) ?",
  },
  {
    id: 'autorite',
    name: 'Autorité',
    neg: 'Libertaire',
    pos: 'Autoritaire',
    description:
      "Place de l'ordre, de la contrainte et de l'autorité publique face aux libertés individuelles : sécurité, justice, police, armée, contrôle.",
  },
  {
    id: 'societe',
    name: 'Société',
    neg: 'Progressiste',
    pos: 'Conservateur',
    description:
      "Rapport aux mœurs, à la famille, à la religion et aux traditions : faire évoluer la société ou préserver l'héritage et les repères existants.",
  },
  {
    id: 'souverainete',
    name: 'Souveraineté',
    neg: 'Supranational',
    pos: 'Souverainiste',
    description:
      "Niveau où doit se prendre la décision politique : au-delà des nations (Europe fédérale, institutions internationales, mondialisation) ou dans le cadre de la nation souveraine.",
  },
  {
    id: 'environnement',
    name: 'Environnement',
    neg: 'Productiviste',
    pos: 'Écologiste',
    description:
      "Priorité donnée à la croissance, à la production et au progrès technique, ou à la préservation de la nature, à la sobriété et aux limites planétaires.",
  },
  {
    id: 'identite',
    name: 'Identité',
    neg: 'Universaliste',
    pos: 'Identitaire',
    description:
      "Conception de la communauté politique : ouverte et fondée sur des valeurs universelles, ou fondée sur un héritage culturel, une origine et une identité à protéger.",
  },
  {
    id: 'methode',
    name: 'Méthode',
    neg: 'Réformiste',
    pos: 'Rupture radicale',
    description:
      "Manière de changer la société : par la réforme progressive, le compromis et les institutions existantes, ou par la rupture, le renversement de l'ordre établi.",
  },
  {
    id: 'territoire',
    name: 'Territoire',
    neg: 'Centralisateur',
    pos: 'Décentralisateur',
    description:
      "Organisation du pouvoir dans l'espace : un État central fort et uniforme (tradition jacobine) ou un pouvoir réparti entre régions, communes et communautés locales.",
  },
  {
    id: 'pouvoir',
    name: 'Pouvoir',
    neg: 'Élitiste',
    pos: 'Populaire',
    description:
      "Qui doit décider : des élites compétentes (experts, représentants, hiérarchies établies) ou le peuple directement (référendum, révocation, démocratie directe).",
  },
]

export const AXIS_BY_ID = Object.fromEntries(AXES.map((a) => [a.id, a])) as Record<AxisId, Axis>

/** Pondération des axes pour l'indicateur synthétique gauche–droite. */
export const LEFT_RIGHT_WEIGHTS: Partial<Record<AxisId, number>> = {
  economie: 0.35,
  societe: 0.25,
  identite: 0.25,
  autorite: 0.15,
}
