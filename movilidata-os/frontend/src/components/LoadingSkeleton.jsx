export function CardSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="h-3 w-24 rounded bg-surface-200" />
      <div className="mt-3 h-7 w-16 rounded bg-surface-200" />
    </div>
  )
}

export function SectionSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-5">
            <div className="h-3 w-20 rounded bg-surface-200" />
            <div className="mt-3 h-7 w-12 rounded bg-surface-200" />
          </div>
        ))}
      </div>
      <div className="card p-6">
        <div className="h-5 w-48 rounded bg-surface-200" />
        <div className="mt-4 h-4 w-72 rounded bg-surface-200" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="h-40 rounded-lg bg-surface-100" />
          <div className="h-40 rounded-lg bg-surface-100" />
        </div>
      </div>
    </div>
  )
}

export function ListSkeleton({ rows = 3 }) {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card p-4">
          <div className="h-3 w-32 rounded bg-surface-200" />
          <div className="mt-2 h-3 w-48 rounded bg-surface-200" />
        </div>
      ))}
    </div>
  )
}
