import { useRef, useState } from 'react'
import EmptyState from './components/EmptyState.tsx'
import ErrorState from './components/ErrorState.tsx'
import LoadingState from './components/LoadingState.tsx'
import LocationHeader from './components/LocationHeader.tsx'
import SearchBar from './components/SearchBar.tsx'
import { useWeather } from './hooks/useWeather.ts'
import { formatLocationSubtitle } from './lib/weatherUtils.ts'
import type { ApiErrorKind, WeatherState } from './types/weather.ts'

const ERROR_COPY: Record<ApiErrorKind, { title: string; message: string }> = {
  network: {
    title: 'Couldn’t connect',
    message: 'Check your internet connection and try again.',
  },
  timeout: {
    title: 'This is taking too long',
    message: 'The weather service didn’t respond in time. Try again in a moment.',
  },
  server: {
    title: 'Something went wrong',
    message: 'The weather service isn’t responding right now. Try again in a moment.',
  },
  'invalid-response': {
    title: 'Something went wrong',
    message: 'The weather service sent back data we couldn’t read. Try again in a moment.',
  },
}

/** Short text for screen readers describing what the results area now shows. */
function getStatusMessage(state: WeatherState): string {
  switch (state.status) {
    case 'idle':
      return ''
    case 'loading':
      return `Searching for ${state.query}…`
    case 'not-found':
      return `No results for ${state.query}.`
    case 'error':
      return ERROR_COPY[state.kind].title
    case 'success': {
      const subtitle = formatLocationSubtitle(state.location)
      return `Showing ${state.location.name}${subtitle ? `, ${subtitle}` : ''}.`
    }
  }
}

function App() {
  const [query, setQuery] = useState('')
  const { state, search } = useWeather()
  const inputRef = useRef<HTMLInputElement>(null)

  /** Searches from outside the form (example cities, retry) and keeps focus in the search box. */
  function searchFor(city: string) {
    setQuery(city)
    search(city)
    inputRef.current?.focus()
  }

  function renderResult() {
    switch (state.status) {
      case 'idle':
        return <EmptyState onSelectCity={searchFor} />
      case 'loading':
        return <LoadingState />
      case 'not-found':
        return (
          <ErrorState
            title={`No results for “${state.query}”`}
            message="Check the spelling, or add a country or region, like “Paris, France”."
          />
        )
      case 'error':
        return (
          <ErrorState
            title={ERROR_COPY[state.kind].title}
            message={ERROR_COPY[state.kind].message}
            onRetry={() => searchFor(state.query)}
          />
        )
      case 'success':
        return <LocationHeader location={state.location} />
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 sm:px-6">
      <header className="flex h-16 items-center">
        <span className="text-lg font-semibold tracking-tight">Clima</span>
      </header>

      <main className="flex-1 pt-6 pb-16 sm:pt-10">
        <SearchBar value={query} onChange={setQuery} onSearch={search} inputRef={inputRef} />

        <p role="status" className="sr-only">
          {getStatusMessage(state)}
        </p>

        {/* Keyed by status so each new state plays the enter animation once. */}
        <div key={state.status} className="mt-12 motion-safe:animate-enter sm:mt-16">
          {renderResult()}
        </div>
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
