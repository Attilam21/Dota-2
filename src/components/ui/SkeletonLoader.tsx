/**
 * Skeleton Loader Component
 *
 * Componente riutilizzabile per placeholder eleganti durante il caricamento
 * Utilizzato per eliminare "flash" visivi e stati bloccati
 */

interface SkeletonLoaderProps {
  variant?: 'card' | 'text' | 'chart' | 'circle'
  width?: string
  height?: string
  className?: string
}

export default function SkeletonLoader({
  variant = 'text',
  width,
  height,
  className = '',
}: SkeletonLoaderProps) {
  const baseClasses = 'animate-pulse bg-neutral-800 rounded'

  const variantClasses = {
    card: 'w-full h-32',
    text: 'h-4 w-3/4',
    chart: 'w-full h-48',
    circle: 'w-8 h-8 rounded-full',
  }

  const style: React.CSSProperties = {}
  if (width) style.width = width
  if (height) style.height = height

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      aria-label="Caricamento..."
    />
  )
}

/**
 * Skeleton Card - Placeholder per card complete
 */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 ${className}`}
    >
      <SkeletonLoader variant="text" className="mb-3 w-1/2" />
      <SkeletonLoader variant="text" className="mb-2 w-3/4" />
      <SkeletonLoader variant="text" className="w-1/2" />
    </div>
  )
}

/**
 * Skeleton Chart - Placeholder per grafici
 */
export function SkeletonChart({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 ${className}`}
    >
      <SkeletonLoader variant="text" className="mb-4 w-1/3" />
      <SkeletonLoader variant="chart" />
    </div>
  )
}

/**
 * Skeleton Grid - Placeholder per griglie di card
 */
export function SkeletonGrid({
  cols = 3,
  className = '',
}: {
  cols?: number
  className?: string
}) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
  }

  return (
    <div
      className={`grid gap-4 ${
        gridCols[cols as keyof typeof gridCols]
      } ${className}`}
    >
      {Array.from({ length: cols }).map((_, idx) => (
        <SkeletonCard key={idx} />
      ))}
    </div>
  )
}
