/**
 * InfoBanner Component
 *
 * Reusable banner component to clearly distinguish between:
 * - Match-specific analysis (single match)
 * - Historical analysis (aggregated from last N matches)
 */

type InfoBannerProps = {
  variant: 'match' | 'history'
  title: string
  description?: string
}

export function InfoBanner({ variant, title, description }: InfoBannerProps) {
  const base = 'rounded-xl px-4 py-3 mb-4 text-sm border bg-black/20'
  const variantClasses =
    variant === 'match'
      ? 'border-sky-700/60 bg-sky-900/20'
      : 'border-emerald-700/60 bg-emerald-900/15'

  return (
    <div className={`${base} ${variantClasses}`}>
      <div className="font-semibold text-slate-50">{title}</div>
      {description && (
        <div className="mt-1 text-xs text-slate-200/80 sm:text-sm">
          {description}
        </div>
      )}
    </div>
  )
}
