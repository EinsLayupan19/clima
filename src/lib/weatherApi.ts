import type { ApiErrorKind, Location } from '../types/weather.ts'

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const REQUEST_TIMEOUT_MS = 10_000

export class ApiError extends Error {
  readonly kind: ApiErrorKind

  constructor(kind: ApiErrorKind, message: string) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
  }
}

interface FetchJsonOptions {
  signal?: AbortSignal
  timeoutMs?: number
}

/**
 * Fetches a URL and parses its JSON body.
 * Failures become an ApiError, except a caller-initiated abort, which is
 * rethrown as-is so the caller can tell "cancelled" apart from "failed".
 */
export async function fetchJson(
  url: string,
  { signal, timeoutMs = REQUEST_TIMEOUT_MS }: FetchJsonOptions = {},
): Promise<unknown> {
  const timeout = AbortSignal.timeout(timeoutMs)
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout

  let response: Response
  try {
    response = await fetch(url, { signal: combined })
  } catch (error) {
    if (signal?.aborted) throw error
    if (timeout.aborted) throw new ApiError('timeout', 'The request timed out.')
    throw new ApiError('network', 'The request could not be sent.')
  }

  if (!response.ok) {
    throw new ApiError('server', `The server responded with status ${response.status}.`)
  }

  try {
    return await response.json()
  } catch {
    throw new ApiError('invalid-response', 'The response was not valid JSON.')
  }
}

/** Finds the best-matching place for a city name, or null if nothing matches. */
export async function searchLocation(
  query: string,
  signal?: AbortSignal,
): Promise<Location | null> {
  const params = new URLSearchParams({
    name: query,
    count: '1',
    language: 'en',
    format: 'json',
  })
  const data = await fetchJson(`${GEOCODING_URL}?${params}`, { signal })
  return parseGeocodingResponse(data)
}

function parseGeocodingResponse(data: unknown): Location | null {
  if (!isRecord(data)) throw invalidResponse()

  // Open-Meteo omits `results` entirely when nothing matches.
  if (data.results === undefined) return null
  if (!Array.isArray(data.results)) throw invalidResponse()
  if (data.results.length === 0) return null

  const result: unknown = data.results[0]
  if (
    !isRecord(result) ||
    typeof result.id !== 'number' ||
    typeof result.name !== 'string' ||
    !isFiniteNumber(result.latitude) ||
    !isFiniteNumber(result.longitude)
  ) {
    throw invalidResponse()
  }

  const location: Location = {
    id: result.id,
    name: result.name,
    latitude: result.latitude,
    longitude: result.longitude,
  }
  if (typeof result.admin1 === 'string') location.region = result.admin1
  if (typeof result.country === 'string') location.country = result.country
  return location
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function invalidResponse() {
  return new ApiError('invalid-response', 'The location data was not in the expected format.')
}
