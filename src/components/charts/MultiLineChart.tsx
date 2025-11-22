/**
 * Componente MultiLineChart per grafici con più linee
 * Usa SVG inline come gli altri grafici della dashboard
 */

interface MultiLineChartProps {
  data: Array<{
    x: number | string
    winrate?: number
    kda?: number
    gpm?: number
    xpm?: number
    fzthScore?: number
    label?: string
    [key: string]: number | string | undefined
  }>
  width?: number
  height?: number
  showGrid?: boolean
  lines?: Array<{ key: string; color: string; label: string }>
}

export default function MultiLineChart({
  data,
  width = 560,
  height = 200,
  showGrid = true,
  lines = [
    { key: 'winrate', color: '#22c55e', label: 'Winrate %' },
    { key: 'kda', color: '#60a5fa', label: 'KDA' },
    { key: 'gpm', color: '#f59e0b', label: 'GPM' },
  ],
}: MultiLineChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-sm text-neutral-500">Dati non disponibili</div>
  }

  const minX = 0
  const maxX = data.length - 1

  // Calcola range Y per tutte le linee
  const allYValues: number[] = []
  data.forEach((d) => {
    lines.forEach((line) => {
      const val = d[line.key as keyof typeof d] as number | undefined
      if (val !== undefined) allYValues.push(val)
    })
  })

  const minY = Math.min(...allYValues, 0)
  const maxY = Math.max(...allYValues, 0)

  const scaleX = (x: number) =>
    ((x - minX) / (maxX - minX || 1)) * (width - 60) + 30
  const scaleY = (y: number) =>
    height - (((y - minY) / (maxY - minY || 1)) * (height - 40) + 20)

  return (
    <div className="w-full">
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="text-neutral-300"
      >
        {showGrid && (
          <line
            x1="0"
            y1={scaleY(0)}
            x2={width}
            y2={scaleY(0)}
            stroke="currentColor"
            strokeOpacity="0.2"
            strokeWidth="1"
          />
        )}
        {lines.map((line, lineIdx) => {
          const path = data
            .map((d, i) => {
              const val = d[line.key as keyof typeof d] as number | undefined
              if (val === undefined) return null
              return `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(val)}`
            })
            .filter((p) => p !== null)
            .join(' ')

          return (
            <g key={lineIdx}>
              <path
                d={path}
                fill="none"
                stroke={line.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Punti sui dati */}
              {data.map((d, i) => {
                const val = d[line.key as keyof typeof d] as number | undefined
                if (val === undefined) return null
                return (
                  <circle
                    key={i}
                    cx={scaleX(i)}
                    cy={scaleY(val)}
                    r="3"
                    fill={line.color}
                    className="hover:r-4 transition-all"
                  />
                )
              })}
              {/* Legenda */}
              <text
                x={20 + lineIdx * 100}
                y={15}
                fontSize="10"
                fill={line.color}
              >
                {line.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
