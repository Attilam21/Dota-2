/**
 * Componente LineChart riutilizzabile per grafici a linea
 * Usa SVG inline come gli altri grafici della dashboard
 */

interface LineChartProps {
  data: Array<{ x: number | string; y: number; label?: string }>
  width?: number
  height?: number
  color?: string
  label?: string
  showGrid?: boolean
}

export default function LineChart({
  data,
  width = 560,
  height = 160,
  color = '#60a5fa',
  label,
  showGrid = true,
}: LineChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-sm text-neutral-500">Dati non disponibili</div>
  }

  const minX = 0
  const maxX = data.length - 1
  const allY = data.map((d) => d.y)
  const minY = Math.min(...allY, 0)
  const maxY = Math.max(...allY, 0)

  const scaleX = (x: number) =>
    ((x - minX) / (maxX - minX || 1)) * (width - 40) + 20
  const scaleY = (y: number) =>
    height - (((y - minY) / (maxY - minY || 1)) * (height - 30) + 15)

  const path = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(d.y)}`)
    .join(' ')

  return (
    <div className="w-full">
      {label && <div className="mb-2 text-xs text-neutral-400">{label}</div>}
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="text-blue-400"
      >
        {showGrid && (
          <line
            x1="0"
            y1={scaleY(0)}
            x2={width}
            y2={scaleY(0)}
            stroke="currentColor"
            strokeOpacity="0.3"
            strokeWidth="1"
          />
        )}
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Punti sui dati */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={scaleX(i)}
            cy={scaleY(d.y)}
            r="3"
            fill={color}
            className="hover:r-4 transition-all"
          />
        ))}
      </svg>
    </div>
  )
}
