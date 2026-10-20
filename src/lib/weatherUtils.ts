import type { Location } from '../types/weather.ts'

/** Trims a search query and collapses runs of whitespace into single spaces. */
export function normalizeQuery(input: string): string {
  return input.trim().replace(/\s+/g, ' ')
}

/** "Region, Country", skipping parts that are missing or repeat the city name. */
export function formatLocationSubtitle(location: Location): string {
  const region = location.region !== location.name ? location.region : undefined
  return [region, location.country].filter(Boolean).join(', ')
}
