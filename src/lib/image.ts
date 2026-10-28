import { AXES, AXIS_BY_ID, type AxisId } from '../data/axes'
import { SITE } from '../config'
import { leftRightLabel, type Results } from './scoring'
import { placeLabels } from './labels'

const W = 1080
const H = 1350
const BLUE = '#1d3f8f'
const RED = '#c8283a'
const INK = '#0f172a'
const MUTED = '#64748b'
const LINE = '#e2e8f0'
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Dessine l'image de partage (format portrait 4:5, adapté aux réseaux sociaux). */
export function drawShareImage(results: Results, xAxis: AxisId = 'economie', yAxis: AxisId = 'autorite'): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = BLUE
  ctx.fillRect(0, 0, W / 3, 14)
  ctx.fillStyle = '#e9edf5'
  ctx.fillRect(W / 3, 0, W / 3, 14)
  ctx.fillStyle = RED
  ctx.fillRect((2 * W) / 3, 0, W / 3, 14)

  const top = results.affinities[0]
  ctx.fillStyle = MUTED
  ctx.font = `600 30px ${FONT}`
  ctx.fillText('MON COURANT DE PENSÉE POLITIQUE', 60, 92)
  ctx.fillStyle = INK
  ctx.font = `800 64px ${FONT}`
  const name = top?.courant.name ?? '—'
  let size = 64
  while (ctx.measureText(name).width > W - 120 && size > 36) {
    size -= 2
    ctx.font = `800 ${size}px ${FONT}`
  }
  ctx.fillText(name, 60, 170)
  ctx.fillStyle = BLUE
  ctx.font = `700 36px ${FONT}`
  ctx.fillText(`${top ? top.affinity.toFixed(0) : 0} % d'affinité · ${leftRightLabel(results.leftRight)}`, 60, 222)

  // Barre gauche–droite
  const by = 262
  const grad = ctx.createLinearGradient(60, 0, W - 60, 0)
  grad.addColorStop(0, RED)
  grad.addColorStop(0.5, '#cbd5e1')
  grad.addColorStop(1, BLUE)
  roundRect(ctx, 60, by, W - 120, 14, 7)
  ctx.fillStyle = grad
  ctx.fill()
  if (results.leftRight !== null) {
    const x = 60 + ((results.leftRight + 1) / 2) * (W - 120)
    ctx.beginPath()
    ctx.arc(x, by + 7, 16, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.lineWidth = 6
    ctx.strokeStyle = INK
    ctx.stroke()
  }
  ctx.fillStyle = MUTED
  ctx.font = `500 24px ${FONT}`
  ctx.fillText('Gauche', 60, by + 50)
  const dr = 'Droite'
  ctx.fillText(dr, W - 60 - ctx.measureText(dr).width, by + 50)

  // Boussole
  const cx0 = 60
  const cy0 = 360
  const S = 560
  ctx.fillStyle = '#f8fafc'
  roundRect(ctx, cx0, cy0, S, S, 20)
  ctx.fill()
  ctx.strokeStyle = LINE
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx0 + S / 2, cy0 + 16)
  ctx.lineTo(cx0 + S / 2, cy0 + S - 16)
  ctx.moveTo(cx0 + 16, cy0 + S / 2)
  ctx.lineTo(cx0 + S - 16, cy0 + S / 2)
  ctx.strokeStyle = '#cbd5e1'
  ctx.stroke()
  const xa = AXIS_BY_ID[xAxis]
  const ya = AXIS_BY_ID[yAxis]
  ctx.fillStyle = MUTED
  ctx.font = `600 20px ${FONT}`
  ctx.textAlign = 'center'
  ctx.fillText(ya.pos, cx0 + S / 2, cy0 - 12)
  ctx.fillText(ya.neg, cx0 + S / 2, cy0 + S + 30)
  ctx.textAlign = 'left'
  ctx.save()
  ctx.translate(cx0 - 14, cy0 + S / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.textAlign = 'center'
  ctx.fillText(xa.neg, 0, 0)
  ctx.restore()
  ctx.save()
  ctx.translate(cx0 + S + 28, cy0 + S / 2)
  ctx.rotate(Math.PI / 2)
  ctx.textAlign = 'center'
  ctx.fillText(xa.pos, 0, 0)
  ctx.restore()

  const pad = 40
  const px = (v: number) => cx0 + pad + ((v + 1) / 2) * (S - 2 * pad)
  const py = (v: number) => cy0 + pad + ((1 - v) / 2) * (S - 2 * pad)

  const shown = results.affinities.slice(0, 5)
  const ux = results.axes[xAxis].score
  const uy = results.axes[yAxis].score
  const hasYou = ux !== null && uy !== null
  for (const a of results.affinities) {
    const isTop = shown.includes(a)
    ctx.beginPath()
    ctx.arc(px(a.courant.position[xAxis]), py(a.courant.position[yAxis]), isTop ? 9 : 6, 0, Math.PI * 2)
    ctx.fillStyle = isTop ? BLUE : '#cbd5e1'
    ctx.fill()
  }
  if (hasYou) {
    ctx.beginPath()
    ctx.arc(px(ux), py(uy), 18, 0, Math.PI * 2)
    ctx.fillStyle = RED
    ctx.fill()
    ctx.lineWidth = 5
    ctx.strokeStyle = '#fff'
    ctx.stroke()
  }
  ctx.font = `600 19px ${FONT}`
  const labels = placeLabels(
    shown.map((a) => ({
      id: a.courant.id,
      x: px(a.courant.position[xAxis]),
      y: py(a.courant.position[yAxis]),
      width: ctx.measureText(a.courant.short).width,
      height: 20,
      required: true,
    })),
    [cx0 + 4, cy0 + 4, cx0 + S - 4, cy0 + S - 4],
    hasYou ? [[px(ux) - 32, py(uy) - 52, px(ux) + 32, py(uy) + 20]] : [],
    14,
  )
  for (const a of shown) {
    const l = labels.get(a.courant.id)
    if (!l) continue
    ctx.textAlign = l.anchor === 'start' ? 'left' : l.anchor === 'end' ? 'right' : 'center'
    ctx.lineWidth = 6
    ctx.strokeStyle = '#f8fafc'
    ctx.strokeText(a.courant.short, l.x, l.y)
    ctx.fillStyle = INK
    ctx.fillText(a.courant.short, l.x, l.y)
  }
  if (hasYou) {
    ctx.textAlign = 'center'
    ctx.font = `800 22px ${FONT}`
    ctx.lineWidth = 6
    ctx.strokeStyle = '#f8fafc'
    ctx.strokeText('VOUS', px(ux), py(uy) - 28)
    ctx.fillStyle = RED
    ctx.fillText('VOUS', px(ux), py(uy) - 28)
  }
  ctx.textAlign = 'left'

  // Classement
  const lx = 670
  ctx.fillStyle = MUTED
  ctx.font = `600 22px ${FONT}`
  ctx.fillText('COURANTS LES PLUS PROCHES', lx, cy0 + 20)
  results.affinities.slice(0, 8).forEach((a, i) => {
    const y = cy0 + 62 + i * 64
    ctx.fillStyle = INK
    ctx.font = `600 22px ${FONT}`
    ctx.fillText(`${i + 1}. ${a.courant.short}`, lx, y)
    ctx.textAlign = 'right'
    ctx.fillStyle = i === 0 ? BLUE : MUTED
    ctx.fillText(`${a.affinity.toFixed(0)} %`, W - 60, y)
    ctx.textAlign = 'left'
    roundRect(ctx, lx, y + 12, W - 60 - lx, 10, 5)
    ctx.fillStyle = '#eef2f7'
    ctx.fill()
    roundRect(ctx, lx, y + 12, Math.max(10, ((W - 60 - lx) * a.affinity) / 100), 10, 5)
    ctx.fillStyle = i === 0 ? BLUE : '#94a3b8'
    ctx.fill()
  })

  // Axes
  const ay0 = 990
  ctx.fillStyle = MUTED
  ctx.font = `600 22px ${FONT}`
  ctx.fillText('MES AXES', 60, ay0)
  const colW = (W - 120 - 40) / 2
  AXES.forEach((a, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = 60 + col * (colW + 40)
    const y = ay0 + 36 + row * 58
    ctx.fillStyle = INK
    ctx.font = `500 19px ${FONT}`
    ctx.fillText(a.neg, x, y)
    ctx.textAlign = 'right'
    ctx.fillText(a.pos, x + colW, y)
    ctx.textAlign = 'left'
    roundRect(ctx, x, y + 10, colW, 8, 4)
    ctx.fillStyle = '#eef2f7'
    ctx.fill()
    const s = results.axes[a.id].score
    if (s !== null) {
      ctx.beginPath()
      ctx.arc(x + ((s + 1) / 2) * colW, y + 14, 9, 0, Math.PI * 2)
      ctx.fillStyle = s < 0 ? RED : BLUE
      ctx.fill()
    }
  })

  ctx.fillStyle = MUTED
  ctx.font = `500 22px ${FONT}`
  ctx.fillText(SITE.name, 60, H - 40)
  ctx.textAlign = 'right'
  ctx.fillText(window.location.host || '', W - 60, H - 40)
  ctx.textAlign = 'left'
  return canvas
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/png'))
}
