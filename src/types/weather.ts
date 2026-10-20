/** A place to show weather for, from a city search or the user's position. */
export interface Location {
  name: string
  /** State, province or region, when the API knows it. */
  region?: string
  country?: string
  latitude: number
  longitude: number
}

export type Coordinates = Pick<Location, 'latitude' | 'longitude'>

export type TemperatureUnit = 'celsius' | 'fahrenheit'

/**
 * Current conditions at a location, in metric units (°C, km/h, %).
 * Optional readings are null when the API does not provide them.
 */
export interface CurrentWeather {
  temperature: number
  feelsLike: number | null
  humidity: number | null
  windSpeed: number | null
  /** Chance of precipitation for the current hour. */
  precipitationChance: number | null
  /** WMO weather interpretation code. */
  weatherCode: number
  isDay: boolean
}

/** One day of the daily forecast, in °C. */
export interface DailyForecast {
  /** Calendar date at the location, "YYYY-MM-DD". */
  date: string
  isToday: boolean
  /** WMO weather interpretation code for the day's most severe weather. */
  weatherCode: number
  high: number
  low: number
}

/** Everything fetched for a location in one weather request. */
export interface WeatherReport {
  current: CurrentWeather
  /** Valid days only; empty when the forecast could not be read. */
  forecast: DailyForecast[]
}

export type WeatherIconName =
  | 'clear-day'
  | 'clear-night'
  | 'partly-cloudy-day'
  | 'partly-cloudy-night'
  | 'cloudy'
  | 'fog'
  | 'rain'
  | 'snow'
  | 'thunderstorm'
  | 'unknown'

export interface WeatherCondition {
  label: string
  icon: WeatherIconName
}

export type ApiErrorKind = 'network' | 'timeout' | 'server' | 'invalid-response'

export type LocationErrorKind =
  | 'location-denied'
  | 'location-unavailable'
  | 'location-timeout'
  | 'location-unsupported'

/** What the user asked for: weather for a typed city, or for where they are. */
export type WeatherRequest = { kind: 'search'; query: string } | { kind: 'location' }

export type WeatherState =
  | { status: 'idle' }
  | { status: 'loading'; request: WeatherRequest }
  | { status: 'not-found'; query: string }
  | { status: 'error'; request: WeatherRequest; kind: ApiErrorKind | LocationErrorKind }
  | { status: 'success'; location: Location; weather: WeatherReport }
