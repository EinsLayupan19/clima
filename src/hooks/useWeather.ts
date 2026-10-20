import { useCallback, useEffect, useRef, useState } from 'react'
import { getCurrentCoordinates, LocationError } from '../lib/geolocation.ts'
import { ApiError, getWeather, reverseGeocode, searchLocation } from '../lib/weatherApi.ts'
import type { WeatherRequest, WeatherState } from '../types/weather.ts'

/**
 * Owns the request lifecycle: idle → loading → success / not-found / error.
 * Starting a new request cancels the previous one, so a slow earlier
 * response can never overwrite a newer result.
 */
export function useWeather() {
  const [state, setState] = useState<WeatherState>({ status: 'idle' })
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

  const load = useCallback((request: WeatherRequest) => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setState({ status: 'loading', request })

    void loadWeather(request, controller.signal).then((nextState) => {
      if (!controller.signal.aborted) setState(nextState)
    })
  }, [])

  const search = useCallback((query: string) => load({ kind: 'search', query }), [load])
  const searchMyLocation = useCallback(() => load({ kind: 'location' }), [load])

  return { state, search, searchMyLocation }
}

/** Resolves a request to the next state. Never throws. */
async function loadWeather(request: WeatherRequest, signal: AbortSignal): Promise<WeatherState> {
  try {
    if (request.kind === 'search') {
      const location = await searchLocation(request.query, signal)
      if (!location) return { status: 'not-found', query: request.query }

      const weather = await getWeather(location, signal)
      return { status: 'success', location, weather }
    }

    const coordinates = await getCurrentCoordinates()
    // The place name is a nice-to-have: if it fails, still show the weather.
    const [place, weather] = await Promise.all([
      reverseGeocode(coordinates, signal).catch(() => null),
      getWeather(coordinates, signal),
    ])
    return {
      status: 'success',
      location: place ?? { name: 'Current location', ...coordinates },
      weather,
    }
  } catch (error) {
    const kind =
      error instanceof ApiError || error instanceof LocationError ? error.kind : 'invalid-response'
    return { status: 'error', request, kind }
  }
}
