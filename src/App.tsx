function App() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 sm:px-6">
      <header className="flex h-16 items-center">
        <span className="text-lg font-semibold tracking-tight">Clima</span>
      </header>

      <main className="flex-1 pt-12 pb-16 sm:pt-20">
        {/* Search form arrives in Phase 2. */}

        <section aria-labelledby="empty-title" className="max-w-xl">
          <h1
            id="empty-title"
            className="text-4xl font-semibold tracking-tighter text-balance sm:text-5xl"
          >
            Find the weather for any city
          </h1>
          <p className="mt-4 text-base leading-relaxed text-pretty text-ink-muted sm:text-lg">
            See current conditions and the 7-day forecast. Search by city name
            to get started.
          </p>
        </section>
      </main>

      <footer className="border-t border-line py-6 text-sm text-ink-muted">
        Weather data by{' '}
        <a
          href="https://open-meteo.com"
          target="_blank"
          rel="noreferrer"
          className="rounded-sm font-medium text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-ink"
        >
          Open-Meteo
        </a>
      </footer>
    </div>
  )
}

export default App
