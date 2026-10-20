import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, searchLocation } from '../lib/weatherApi.ts'
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

    searchLocation(query, controller.signal).then(
      (location) => {
        if (controller.signal.aborted) return
        setState(location ? { status: 'success', location } : { status: 'not-found', query })
      },
      (error: unknown) => {
        if (controller.signal.aborted) return
        const kind = error instanceof ApiError ? error.kind : 'invalid-response'
        setState({ status: 'error', query, kind })
      },
    )
  }, [])

  return { state, search }
}
