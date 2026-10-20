import type { ApiErrorKind, CurrentWeather, Location } from '../types/weather.ts'

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const REQUEST_TIMEOUT_MS = 10_000

const CURRENT_VARIABLES = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'wind_speed_10m',
  'precipitation_probability',
  'weather_code',
  'is_day',
]

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

/** Fetches the current conditions at a location. */
export async function getCurrentWeather(
  location: Pick<Location, 'latitude' | 'longitude'>,
  signal?: AbortSignal,
): Promise<CurrentWeather> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: CURRENT_VARIABLES.join(','),
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
  })
  const data = await fetchJson(`${FORECAST_URL}?${params}`, { signal })
  return parseCurrentWeather(data)
}

function parseCurrentWeather(data: unknown): CurrentWeather {
  if (!isRecord(data) || !isRecord(data.current)) {
    throw new ApiError('invalid-response', 'The weather data was missing current conditions.')
  }

  const current = data.current
  if (!isFiniteNumber(current.temperature_2m) || !isFiniteNumber(current.weather_code)) {
    throw new ApiError('invalid-response', 'The weather data was missing required values.')
  }

  return {
    temperature: current.temperature_2m,
    feelsLike: optionalNumber(current.apparent_temperature),
    humidity: optionalNumber(current.relative_humidity_2m),
    windSpeed: optionalNumber(current.wind_speed_10m),
    precipitationChance: optionalNumber(current.precipitation_probability),
    weatherCode: current.weather_code,
    // Assume daytime if the flag is missing; it only changes the icon.
    isDay: current.is_day !== 0,
  }
}

function optionalNumber(value: unknown): number | null {
  return isFiniteNumber(value) ? value : null
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
