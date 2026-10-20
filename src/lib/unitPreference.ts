import type { TemperatureUnit } from '../types/weather.ts'

const STORAGE_KEY = 'clima.temperatureUnit'

/**
 * Reads the saved unit. Anything missing or unexpected means Celsius, and
 * storage errors (private browsing, blocked cookies) are treated the same way.
 */
export function loadTemperatureUnit(): TemperatureUnit {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'fahrenheit' ? 'fahrenheit' : 'celsius'
  } catch {
    return 'celsius'
  }
}

/** Saves the unit. If storage is unavailable the choice just lasts for this visit. */
export function saveTemperatureUnit(unit: TemperatureUnit): void {
  try {
    localStorage.setItem(STORAGE_KEY, unit)
  } catch {
    // Nothing to do: the in-memory preference still works.
  }
}
