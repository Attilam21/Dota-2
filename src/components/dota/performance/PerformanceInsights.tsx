/**
 * Performance Insights Component
 *
 * Displays 2-3 textual insights based on calculated KPIs.
 */

interface PerformanceInsightsProps {
  insights: string[]
}

export default function PerformanceInsights({
  insights,
}: PerformanceInsightsProps): React.JSX.Element {
  if (insights.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
        <h2 className="mb-3 text-lg font-semibold text-neutral-200">
          Insight Performance
        </h2>
        <div className="text-sm text-neutral-500">
          Non ci sono abbastanza dati per generare insight.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
      <h2 className="mb-3 text-lg font-semibold text-neutral-200">
        Insight Performance
      </h2>
      <ul className="space-y-2">
        {insights.map((insight, idx) => (
          <li key={idx} className="text-sm text-neutral-300">
            <span className="mr-2 text-blue-400">•</span>
            {insight}
          </li>
        ))}
      </ul>
    </div>
  )
}
