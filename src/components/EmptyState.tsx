const EXAMPLE_CITIES = ['Tokyo', 'Reykjavík', 'Cape Town']

interface EmptyStateProps {
  onSelectCity: (city: string) => void
}

function EmptyState({ onSelectCity }: EmptyStateProps) {
  return (
    <section aria-labelledby="empty-title" className="max-w-xl">
      <h1
        id="empty-title"
        className="text-4xl font-semibold tracking-tighter text-balance sm:text-5xl"
      >
        Find the weather for any city
      </h1>
      <p className="mt-4 text-base leading-relaxed text-pretty text-ink-muted sm:text-lg">
        See current conditions and the 7-day forecast for anywhere in the world.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span id="example-cities" className="text-sm text-ink-muted">
          Try
        </span>
        <ul aria-labelledby="example-cities" className="flex flex-wrap gap-2">
          {EXAMPLE_CITIES.map((city) => (
            <li key={city}>
              <button
                type="button"
                onClick={() => onSelectCity(city)}
                className="h-10 rounded-xl border border-line px-4 text-sm font-medium transition-[scale,background-color] duration-150 ease-out hover:bg-surface active:scale-[0.97]"
              >
                {city}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default EmptyState
