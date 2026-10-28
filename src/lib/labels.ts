export type Box = [number, number, number, number]

export interface LabelPoint {
  id: string
  x: number
  y: number
  /** Largeur estimée du texte. */
  width: number
  /** Hauteur du texte. */
  height: number
  /** Étiquette obligatoire (placée même en cas de chevauchement). */
  required: boolean
}

export interface PlacedLabel {
  x: number
  y: number
  anchor: 'start' | 'middle' | 'end'
}

/**
 * Placement glouton d'étiquettes autour de points : essaie à droite, à gauche, au-dessus puis en dessous,
 * et garde la première position qui ne chevauche ni une autre étiquette ni un obstacle.
 * Les points doivent être fournis par ordre de priorité.
 */
export function placeLabels(points: LabelPoint[], bounds: Box, obstacles: Box[] = [], gap = 8): Map<string, PlacedLabel> {
  const placed = new Map<string, PlacedLabel>()
  const boxes = [...obstacles]
  const hit = (b: Box) =>
    b[0] < bounds[0] ||
    b[2] > bounds[2] ||
    b[1] < bounds[1] ||
    b[3] > bounds[3] ||
    boxes.some((o) => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1])
  for (const p of points) {
    const { x, y, width: w, height: h } = p
    const options: (PlacedLabel & { b: Box })[] = [
      { x: x + gap, y: y + h * 0.35, anchor: 'start', b: [x + gap - 2, y - h / 2, x + gap + w, y + h / 2] },
      { x: x - gap, y: y + h * 0.35, anchor: 'end', b: [x - gap - w, y - h / 2, x - gap + 2, y + h / 2] },
      { x, y: y - gap - 2, anchor: 'middle', b: [x - w / 2, y - gap - h, x + w / 2, y - gap + 2] },
      { x, y: y + gap + h * 0.8, anchor: 'middle', b: [x - w / 2, y + gap - 2, x + w / 2, y + gap + h] },
    ]
    const ok = options.find((o) => !hit(o.b))
    if (!ok && !p.required) continue
    const chosen = ok ?? options[0]
    boxes.push(chosen.b)
    placed.set(p.id, { x: chosen.x, y: chosen.y, anchor: chosen.anchor })
  }
  return placed
}
