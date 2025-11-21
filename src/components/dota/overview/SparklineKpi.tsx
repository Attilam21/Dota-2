/**
 * Componente SparklineKpi - Mini line chart per trend KPI
 * Altezza 40px, larghezza full
 */

interface SparklineKpiProps {
  label: string
  data: number[]
  color?: string
}

export default function SparklineKpi({
  label,
  data,
  color = '#60a5fa',
}: SparklineKpiProps) {
  const width = 200
  const height = 40

  if (!data || data.length < 3) {
    return (
      <div className="flex h-10 items-center justify-between rounded border border-neutral-800 bg-neutral-900/30 px-3">
        <span className="text-xs text-neutral-400">{label}</span>
        <span className="text-xs text-neutral-500">Dati insufficienti</span>
      </div>
    )
  }

  const minX = 0
  const maxX = data.length - 1
  const allY = data
  const minY = Math.min(...allY, 0)
  const maxY = Math.max(...allY, 0)

  const scaleX = (x: number) =>
    ((x - minX) / (maxX - minX || 1)) * (width - 20) + 10
  const scaleY = (y: number) =>
    height - (((y - minY) / (maxY - minY || 1)) * (height - 10) + 5)

  const path = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(d)}`)
    .join(' ')

  const lastValue = data[data.length - 1]

  return (
    <div className="flex h-10 items-center justify-between rounded border border-neutral-800 bg-neutral-900/30 px-3">
      <span className="text-xs text-neutral-400">{label}</span>
      <div className="flex items-center gap-2">
        <svg width={width} height={height} className="text-blue-400">
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-xs font-semibold text-neutral-200">
          {typeof lastValue === 'number'
            ? lastValue.toFixed(lastValue < 10 ? 1 : 0)
            : lastValue}
        </span>
      </div>
    </div>
  )
}
