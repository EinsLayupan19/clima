import type { Location, WeatherCondition, WeatherIconName } from '../types/weather.ts'

/** Trims a search query and collapses runs of whitespace into single spaces. */
export function normalizeQuery(input: string): string {
  return input.trim().replace(/\s+/g, ' ')
}

/** "Region, Country", skipping parts that are missing or repeat the city name. */
export function formatLocationSubtitle(location: Location): string {
  const region = location.region !== location.name ? location.region : undefined
  return [region, location.country].filter(Boolean).join(', ')
}

type IconGroup = 'clear' | 'partly-cloudy' | Exclude<WeatherIconName, `${string}-day` | `${string}-night`>

/** WMO weather codes used by Open-Meteo: https://open-meteo.com/en/docs#weather_variable_documentation */
const WEATHER_CODES: Record<number, { label: string; icon: IconGroup }> = {
  0: { label: 'Clear sky', icon: 'clear' },
  1: { label: 'Mainly clear', icon: 'partly-cloudy' },
  2: { label: 'Partly cloudy', icon: 'partly-cloudy' },
  3: { label: 'Overcast', icon: 'cloudy' },
  45: { label: 'Fog', icon: 'fog' },
  48: { label: 'Freezing fog', icon: 'fog' },
  51: { label: 'Light drizzle', icon: 'rain' },
  53: { label: 'Drizzle', icon: 'rain' },
  55: { label: 'Heavy drizzle', icon: 'rain' },
  56: { label: 'Light freezing drizzle', icon: 'rain' },
  57: { label: 'Freezing drizzle', icon: 'rain' },
  61: { label: 'Light rain', icon: 'rain' },
  63: { label: 'Rain', icon: 'rain' },
  65: { label: 'Heavy rain', icon: 'rain' },
  66: { label: 'Light freezing rain', icon: 'rain' },
  67: { label: 'Freezing rain', icon: 'rain' },
  71: { label: 'Light snow', icon: 'snow' },
  73: { label: 'Snow', icon: 'snow' },
  75: { label: 'Heavy snow', icon: 'snow' },
  77: { label: 'Snow grains', icon: 'snow' },
  80: { label: 'Light rain showers', icon: 'rain' },
  81: { label: 'Rain showers', icon: 'rain' },
  82: { label: 'Heavy rain showers', icon: 'rain' },
  85: { label: 'Light snow showers', icon: 'snow' },
  86: { label: 'Heavy snow showers', icon: 'snow' },
  95: { label: 'Thunderstorm', icon: 'thunderstorm' },
  96: { label: 'Thunderstorm with hail', icon: 'thunderstorm' },
  99: { label: 'Thunderstorm with heavy hail', icon: 'thunderstorm' },
}

/** Turns a WMO weather code into a readable label and an icon name. */
export function getWeatherCondition(code: number, isDay: boolean): WeatherCondition {
  const condition = WEATHER_CODES[code]
  if (!condition) return { label: 'Unknown conditions', icon: 'unknown' }

  const { label, icon } = condition
  if (icon === 'clear' || icon === 'partly-cloudy') {
    return { label, icon: `${icon}-${isDay ? 'day' : 'night'}` }
  }
  return { label, icon }
}

/** Rounds to a whole degree. `|| 0` turns -0 (from rounding -0.4) into 0. */
export function roundTemperature(celsius: number): number {
  return Math.round(celsius) || 0
}

/** Whole degrees with a degree sign, e.g. "34°". */
export function formatTemperature(celsius: number): string {
  return `${roundTemperature(celsius)}°`
}

// Forecast dates are calendar days at the location ("2026-10-21"). Reading them
// as midnight UTC and formatting in UTC keeps the browser's time zone out of it.
const weekdayFormat = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' })
const shortDateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

function parseIsoDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`)
}

/** "Today" for the current day, otherwise the short weekday, e.g. "Wed". */
export function formatDayLabel(isoDate: string, isToday: boolean): string {
  return isToday ? 'Today' : weekdayFormat.format(parseIsoDate(isoDate))
}

/** Month and day, e.g. "Oct 21". */
export function formatShortDate(isoDate: string): string {
  return shortDateFormat.format(parseIsoDate(isoDate))
}

export function formatWindSpeed(kmh: number): string {
  return `${Math.round(kmh)} km/h`
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}
