import { useEffect, useRef, useState } from 'react'
import CurrentWeather from './components/CurrentWeather.tsx'
import EmptyState from './components/EmptyState.tsx'
import ErrorState from './components/ErrorState.tsx'
import Forecast from './components/Forecast.tsx'
import LoadingState from './components/LoadingState.tsx'
import LocationButton from './components/LocationButton.tsx'
import SearchBar from './components/SearchBar.tsx'
import UnitToggle from './components/UnitToggle.tsx'
import { useTemperatureUnit } from './hooks/useTemperatureUnit.ts'
import { useWeather } from './hooks/useWeather.ts'
import {
  formatLocationSubtitle,
  formatUnitSymbol,
  getWeatherCondition,
  roundTemperature,
} from './lib/weatherUtils.ts'
import type {
  ApiErrorKind,
  LocationErrorKind,
  TemperatureUnit,
  WeatherState,
} from './types/weather.ts'

interface ErrorCopy {
  title: string
  message: string
  /** False when trying again cannot help, e.g. the user blocked location access. */
  canRetry: boolean
}

const ERROR_COPY: Record<ApiErrorKind | LocationErrorKind, ErrorCopy> = {
  network: {
    title: 'Couldn’t connect',
    message: 'Check your internet connection and try again.',
    canRetry: true,
  },
  timeout: {
    title: 'This is taking too long',
    message: 'The weather service didn’t respond in time. Try again in a moment.',
    canRetry: true,
  },
  server: {
    title: 'Something went wrong',
    message: 'The weather service isn’t responding right now. Try again in a moment.',
    canRetry: true,
  },
  'invalid-response': {
    title: 'Something went wrong',
    message: 'The weather service sent back data we couldn’t read. Try again in a moment.',
    canRetry: true,
  },
  'location-denied': {
    title: 'Location access is off',
    message: 'To use your location, allow it in your browser’s site settings, or search for a city instead.',
    canRetry: false,
  },
  'location-unavailable': {
    title: 'Couldn’t find your location',
    message: 'Your device couldn’t work out where you are. Try again, or search for a city.',
    canRetry: true,
  },
  'location-timeout': {
    title: 'Finding your location took too long',
    message: 'Try again, or search for a city.',
    canRetry: true,
  },
  'location-unsupported': {
    title: 'Location isn’t available',
    message: 'This browser can’t share your location. Search for a city instead.',
    canRetry: false,
  },
}

/** Short text for screen readers describing what the results area now shows. */
function getStatusMessage(state: WeatherState, unit: TemperatureUnit): string {
  switch (state.status) {
    case 'idle':
      return ''
    case 'loading':
      return state.request.kind === 'search'
        ? `Searching for ${state.request.query}…`
        : 'Finding your location…'
    case 'not-found':
      return `No results for ${state.query}.`
    case 'error':
      return ERROR_COPY[state.kind].title
    case 'success': {
      const { location } = state
      const weather = state.weather.current
      const subtitle = formatLocationSubtitle(location)
      const place = subtitle ? `${location.name}, ${subtitle}` : location.name
      const temperature = `${roundTemperature(weather.temperature, unit)}${formatUnitSymbol(unit)}`
      const condition = getWeatherCondition(weather.weatherCode, weather.isDay).label
      return `Showing weather for ${place}: ${temperature}, ${condition.toLowerCase()}.`
    }
  }
}

function App() {
  const [query, setQuery] = useState('')
  const [unit, setUnit] = useTemperatureUnit()
  const { state, search, searchMyLocation } = useWeather()
  const inputRef = useRef<HTMLInputElement>(null)

  const isLocating = state.status === 'loading' && state.request.kind === 'location'

  // Name the browser tab after the city being shown. The default matches index.html.
  const cityName = state.status === 'success' ? state.location.name : null
  useEffect(() => {
    document.title = cityName ? `${cityName} weather - Clima` : 'Clima - Weather for any city'
  }, [cityName])

  /** Searches from outside the form (example cities, retry) and keeps focus in the search box. */
  function searchFor(city: string) {
    setQuery(city)
    search(city)
    inputRef.current?.focus()
  }

  function handleUseMyLocation() {
    if (isLocating) return
    // Clear the box so it doesn't show a different city than the result.
    setQuery('')
    searchMyLocation()
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
      case 'error': {
        const { request } = state
        const copy = ERROR_COPY[state.kind]
        const retry = () => {
          if (request.kind === 'search') searchFor(request.query)
          else {
            searchMyLocation()
            inputRef.current?.focus()
          }
        }
        return (
          <ErrorState
            title={copy.title}
            message={copy.message}
            onRetry={copy.canRetry ? retry : undefined}
          />
        )
      }
      case 'success':
        return (
          <>
            <CurrentWeather
              location={state.location}
              weather={state.weather.current}
              unit={unit}
            />
            <div className="mt-12 sm:mt-16">
              <Forecast days={state.weather.forecast} unit={unit} />
            </div>
          </>
        )
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 sm:px-6">
      <header className="flex h-16 items-center justify-between">
        <span className="text-lg font-semibold tracking-tight">Clima</span>
        <UnitToggle unit={unit} onChange={setUnit} />
      </header>

      <main className="flex-1 pt-6 pb-16 sm:pt-10">
        <SearchBar value={query} onChange={setQuery} onSearch={search} inputRef={inputRef} />
        <div className="mt-2">
          <LocationButton onClick={handleUseMyLocation} isLocating={isLocating} />
        </div>

        <p role="status" className="sr-only">
          {getStatusMessage(state, unit)}
        </p>

        {/* Keyed by status so each new state plays the enter animation once. */}
        <div key={state.status} className="mt-10 motion-safe:animate-enter sm:mt-14">
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
          Open-Meteo <span className="sr-only">(opens in a new tab)</span>
        </a>
      </footer>
    </div>
  )
}

export default App
