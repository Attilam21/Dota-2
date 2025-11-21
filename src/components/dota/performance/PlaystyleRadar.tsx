/**
 * Componente PlaystyleRadar - Radar chart per stile di gioco
 * 4 assi: aggressività, partecipazione fight, farm efficiency, macro pressure
 */

interface PlaystyleRadarProps {
  aggression: number // 0-100
  kp: number // 0-100 (kill participation %)
  farm: number // 0-100
  macro: number // 0-100
}

export default function PlaystyleRadar({
  aggression,
  kp,
  farm,
  macro,
}: PlaystyleRadarProps) {
  const width = 300
  const height = 300
  const centerX = width / 2
  const centerY = height / 2
  const radius = 100

  // Normalizza valori a 0-100
  const normalize = (val: number) => Math.max(0, Math.min(100, val))

  const aggNorm = normalize(aggression)
  const kpNorm = normalize(kp)
  const farmNorm = normalize(farm)
  const macroNorm = normalize(macro)

  // Calcola punti per i 4 assi (0°, 90°, 180°, 270°)
  const angleStep = (Math.PI * 2) / 4
  const points = [
    {
      angle: 0, // Aggressività (destra)
      value: aggNorm,
      label: 'Aggressività',
    },
    {
      angle: Math.PI / 2, // KP (alto)
      value: kpNorm,
      label: 'KP%',
    },
    {
      angle: Math.PI, // Farm (sinistra)
      value: farmNorm,
      label: 'Farm',
    },
    {
      angle: (3 * Math.PI) / 2, // Macro (basso)
      value: macroNorm,
      label: 'Macro',
    },
  ]

  // Calcola coordinate polari
  const getPoint = (angle: number, value: number) => {
    const r = (value / 100) * radius
    const x = centerX + r * Math.cos(angle - Math.PI / 2)
    const y = centerY + r * Math.sin(angle - Math.PI / 2)
    return { x, y }
  }

  // Crea path per il poligono
  const pathPoints = points.map((p) => getPoint(p.angle, p.value))
  const path =
    pathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') +
    ' Z'

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-4">
      <h3 className="mb-4 text-sm font-semibold text-neutral-200">
        Stile di Gioco - Radar
      </h3>
      <div className="flex items-center justify-center">
        <svg width={width} height={height} className="text-neutral-300">
          {/* Griglia circolare */}
          {[0.25, 0.5, 0.75, 1.0].map((scale) => (
            <circle
              key={scale}
              cx={centerX}
              cy={centerY}
              r={radius * scale}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.2"
              strokeWidth="1"
            />
          ))}

          {/* Assi */}
          {points.map((p, i) => {
            const end = getPoint(p.angle, 100)
            return (
              <line
                key={i}
                x1={centerX}
                y1={centerY}
                x2={end.x}
                y2={end.y}
                stroke="currentColor"
                strokeOpacity="0.3"
                strokeWidth="1"
              />
            )
          })}

          {/* Poligono dati */}
          <path
            d={path}
            fill="#60a5fa"
            fillOpacity="0.3"
            stroke="#60a5fa"
            strokeWidth="2"
          />

          {/* Punti e etichette */}
          {points.map((p, i) => {
            const point = getPoint(p.angle, p.value)
            const labelPos = getPoint(p.angle, 120)
            const tooltips: Record<string, string> = {
              Aggressività:
                'Aggressività: capacità di generare kill e pressione',
              'KP%': 'KP%: partecipazione ai combattimenti',
              Farm: 'Farm: efficienza nella raccolta risorse',
              Macro: 'Macro: gestione degli obiettivi',
            }
            return (
              <g key={i}>
                <circle cx={point.x} cy={point.y} r="4" fill="#60a5fa" />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  fontSize="10"
                  fill="currentColor"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  <title>{tooltips[p.label] || p.label}</title>
                  {p.label}
                </text>
                <text
                  x={point.x}
                  y={point.y - 8}
                  fontSize="9"
                  fill="#60a5fa"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {p.value.toFixed(0)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
