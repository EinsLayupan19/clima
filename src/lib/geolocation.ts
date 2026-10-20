import type { Coordinates, LocationErrorKind } from '../types/weather.ts'

export class LocationError extends Error {
  readonly kind: LocationErrorKind

  constructor(kind: LocationErrorKind, message: string) {
    super(message)
    this.name = 'LocationError'
    this.kind = kind
  }
}

// GeolocationPositionError codes, from the Geolocation API spec.
const ERROR_KINDS: Record<number, LocationErrorKind> = {
  1: 'location-denied',
  2: 'location-unavailable',
  3: 'location-timeout',
}

const POSITION_OPTIONS: PositionOptions = {
  // City-level accuracy is enough for weather, and it is faster and kinder to batteries.
  enableHighAccuracy: false,
  timeout: 10_000,
  // Reuse a position from the last 10 minutes instead of asking the device again.
  maximumAge: 10 * 60_000,
}

/**
 * Asks the browser where the user is. The browser shows its own permission
 * prompt the first time; after a refusal it answers "denied" without asking.
 *
 * Coordinates are rounded to 2 decimal places (about 1 km) right away, so a
 * precise position never leaves this function.
 */
export function getCurrentCoordinates(): Promise<Coordinates> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.reject(
      new LocationError('location-unsupported', 'This browser does not support geolocation.'),
    )
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({
          latitude: roundCoordinate(coords.latitude),
          longitude: roundCoordinate(coords.longitude),
        }),
      (error) =>
        reject(new LocationError(ERROR_KINDS[error.code] ?? 'location-unavailable', error.message)),
      POSITION_OPTIONS,
    )
  })
}

function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100
}
