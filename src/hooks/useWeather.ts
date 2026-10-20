import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, getWeather, searchLocation } from '../lib/weatherApi.ts'
import type { WeatherState } from '../types/weather.ts'

/**
 * Owns the search lifecycle: idle → loading → success / not-found / error.
 * Starting a new search cancels the previous one, so a slow earlier
 * response can never overwrite a newer result.
 */
export function useWeather() {
  const [state, setState] = useState<WeatherState>({ status: 'idle' })
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

  const search = useCallback((query: string) => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setState({ status: 'loading', query })

    void loadWeather(query, controller.signal).then((nextState) => {
      if (!controller.signal.aborted) setState(nextState)
    })
  }, [])

  return { state, search }
}

/** City search, then current weather and forecast for the best match. Never throws. */
async function loadWeather(query: string, signal: AbortSignal): Promise<WeatherState> {
  try {
    const location = await searchLocation(query, signal)
    if (!location) return { status: 'not-found', query }

    const weather = await getWeather(location, signal)
    return { status: 'success', location, weather }
  } catch (error) {
    const kind = error instanceof ApiError ? error.kind : 'invalid-response'
    return { status: 'error', query, kind }
  }
}
