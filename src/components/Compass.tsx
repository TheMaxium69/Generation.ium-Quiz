import { useState } from 'react'
import { AXES, AXIS_BY_ID, type AxisId } from '../data/axes'
import type { Results } from '../lib/scoring'
import { placeLabels } from '../lib/labels'

const SIZE = 400
const PAD = 34

export default function Compass({
  results,
  x,
  y,
  onChange,
}: {
  results: Results
  x: AxisId
  y: AxisId
  onChange: (x: AxisId, y: AxisId) => void
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [allLabels, setAllLabels] = useState(false)
  const xa = AXIS_BY_ID[x]
  const ya = AXIS_BY_ID[y]
  const px = (v: number) => PAD + ((v + 1) / 2) * (SIZE - 2 * PAD)
  const py = (v: number) => PAD + ((1 - v) / 2) * (SIZE - 2 * PAD)
  const top = new Set(results.affinities.slice(0, 5).map((a) => a.courant.id))
  const ux = results.axes[x].score
  const uy = results.axes[y].score
  const sel = results.affinities.find((a) => a.courant.id === selected)

  // Étiquettes sans chevauchement, par priorité : sélection, 5 plus proches, autres.
  const isImportant = (id: string) => top.has(id) || id === selected
  const labels = placeLabels(
    [...results.affinities]
      .filter((a) => allLabels || isImportant(a.courant.id))
      .sort(
        (a, b) =>
          Number(b.courant.id === selected) - Number(a.courant.id === selected) ||
          Number(isImportant(b.courant.id)) - Number(isImportant(a.courant.id)),
      )
      .map((a) => ({
        id: a.courant.id,
        x: px(a.courant.position[x]),
        y: py(a.courant.position[y]),
        width: a.courant.short.length * (isImportant(a.courant.id) ? 6 : 5.4),
        height: 12,
        required: isImportant(a.courant.id),
      })),
    [2, 24, SIZE - 2, SIZE - 28],
    ux !== null && uy !== null ? [[px(ux) - 18, py(uy) - 26, px(ux) + 18, py(uy) + 10]] : [],
  )

  return (
    <div className="compass card compass-wrap">
      <div className="compass-controls">
        <label>
          Axe horizontal
          <select value={x} onChange={(e) => onChange(e.target.value as AxisId, y)}>
            {AXES.filter((a) => a.id !== y).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Axe vertical
          <select value={y} onChange={(e) => onChange(x, e.target.value as AxisId)}>
            {AXES.filter((a) => a.id !== x).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <svg viewBox={`-6 -6 ${SIZE + 12} ${SIZE + 12}`} role="img" aria-label={`Carte ${xa.name} et ${ya.name}`}>
        <rect x="0" y="0" width={SIZE} height={SIZE} rx="14" fill="var(--bg-soft)" stroke="var(--line)" />
        <rect x={SIZE / 2} y="0" width={SIZE / 2} height={SIZE / 2} rx="0" fill="var(--blue)" opacity="0.035" />
        <rect x="0" y={SIZE / 2} width={SIZE / 2} height={SIZE / 2} fill="var(--red)" opacity="0.035" />
        {[0.25, 0.5, 0.75].map((f) => (
          <g key={f} stroke="var(--line)" strokeWidth={f === 0.5 ? 1.4 : 0.8}>
            <line x1={SIZE * f} y1="10" x2={SIZE * f} y2={SIZE - 10} />
            <line x1="10" y1={SIZE * f} x2={SIZE - 10} y2={SIZE * f} />
          </g>
        ))}
        <g fontSize="10.5" fontWeight="600" fill="var(--muted)" textAnchor="middle">
          <text x={SIZE / 2} y="18">
            ↑ {ya.pos}
          </text>
          <text x={SIZE / 2} y={SIZE - 22}>
            ↓ {ya.neg}
          </text>
          <text x="12" y={SIZE - 9} textAnchor="start">
            ← {xa.neg}
          </text>
          <text x={SIZE - 12} y={SIZE - 9} textAnchor="end">
            {xa.pos} →
          </text>
        </g>

        {results.affinities.map((a) => {
          const cx = px(a.courant.position[x])
          const cy = py(a.courant.position[y])
          const isTop = top.has(a.courant.id)
          const isSel = selected === a.courant.id
          const label = labels.get(a.courant.id)
          return (
            <g
              key={a.courant.id}
              onClick={() => setSelected(isSel ? null : a.courant.id)}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={cx} cy={cy} r="14" fill="transparent" />
              <circle
                cx={cx}
                cy={cy}
                r={isTop || isSel ? 5.5 : 4}
                fill={isSel ? 'var(--ink)' : isTop ? 'var(--blue)' : 'var(--line-strong)'}
                stroke="var(--surface)"
                strokeWidth="1.5"
              />
              {label && (
                <text
                  x={label.x}
                  y={label.y}
                  fontSize={isTop || isSel ? 10.5 : 9.5}
                  fontWeight={isTop || isSel ? 650 : 500}
                  fill={isTop || isSel ? 'var(--ink)' : 'var(--muted)'}
                  textAnchor={label.anchor}
                  paintOrder="stroke"
                  stroke="var(--bg-soft)"
                  strokeWidth="3"
                >
                  {a.courant.short}
                </text>
              )}
            </g>
          )
        })}

        {ux !== null && uy !== null && (
          <g>
            <circle cx={px(ux)} cy={py(uy)} r="16" fill="var(--red)" opacity="0.15" />
            <circle cx={px(ux)} cy={py(uy)} r="8" fill="var(--red)" stroke="var(--surface)" strokeWidth="2.5" />
            <text
              x={px(ux)}
              y={py(uy) - 15}
              textAnchor="middle"
              fontSize="11"
              fontWeight="800"
              fill="var(--red)"
              paintOrder="stroke"
              stroke="var(--bg-soft)"
              strokeWidth="3"
            >
              VOUS
            </text>
          </g>
        )}
      </svg>

      <div className="compass-legend">
        <span>
          <i style={{ background: 'var(--red)' }} />
          Vous
        </span>
        <span>
          <i style={{ background: 'var(--blue)' }} />5 plus proches
        </span>
        <span>
          <i style={{ background: 'var(--line-strong)' }} />
          Autres courants
        </span>
        <label className="toggle" style={{ marginLeft: 'auto' }}>
          <input type="checkbox" checked={allLabels} onChange={(e) => setAllLabels(e.target.checked)} />
          Tous les noms
        </label>
      </div>
      <div className="compass-selected">
        {sel ? (
          <>
            <strong>{sel.courant.name}</strong> · {sel.affinity.toFixed(1).replace('.', ',')} % d’affinité
          </>
        ) : (
          <span className="muted">Touchez un point pour identifier le courant.</span>
        )}
      </div>
    </div>
  )
}
