/** A place the user searched for, normalized from the geocoding API. */
export interface Location {
  id: number
  name: string
  /** State, province or region, when the API knows it. */
  region?: string
  country?: string
  latitude: number
  longitude: number
}

export type ApiErrorKind = 'network' | 'timeout' | 'server' | 'invalid-response'

export type WeatherState =
  | { status: 'idle' }
  | { status: 'loading'; query: string }
  | { status: 'not-found'; query: string }
  | { status: 'error'; query: string; kind: ApiErrorKind }
  | { status: 'success'; location: Location }
