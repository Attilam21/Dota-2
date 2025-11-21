/**
 * Componente BarChart riutilizzabile per grafici a barre
 */

interface BarChartProps {
  data: Array<{ label: string; value: number; color?: string }>
  width?: number
  height?: number
  showValues?: boolean
}

export default function BarChart({
  data,
  width = 560,
  height = 160,
  showValues = true,
}: BarChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-sm text-neutral-500">Dati non disponibili</div>
  }

  const maxVal = Math.max(1, ...data.map((d) => d.value))
  const barWidth = (width - 40) / data.length - 4
  const scaleY = (v: number) => (v / maxVal) * (height - 30)

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
      {data.map((d, idx) => {
        const x = 20 + idx * (barWidth + 4)
        const barHeight = scaleY(d.value)
        const y = height - barHeight - 10
        return (
          <g key={idx}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={d.color || '#60a5fa'}
              className="transition-opacity hover:opacity-80"
            />
            {showValues && barHeight > 15 && (
              <text
                x={x + barWidth / 2}
                y={y - 5}
                fontSize="10"
                fill="#9ca3af"
                textAnchor="middle"
              >
                {d.value.toFixed(1)}
              </text>
            )}
            <text
              x={x + barWidth / 2}
              y={height - 5}
              fontSize="9"
              fill="#9ca3af"
              textAnchor="middle"
            >
              {d.label.length > 8 ? d.label.substring(0, 8) + '...' : d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
