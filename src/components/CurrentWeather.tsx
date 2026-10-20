import { formatUnitSymbol, getWeatherCondition, roundTemperature } from '../lib/weatherUtils.ts'
import type {
  CurrentWeather as CurrentWeatherData,
  Location,
  TemperatureUnit,
} from '../types/weather.ts'
import LocationHeader from './LocationHeader.tsx'
import WeatherDetails from './WeatherDetails.tsx'
import WeatherIcon from './WeatherIcon.tsx'

interface CurrentWeatherProps {
  location: Location
  weather: CurrentWeatherData
  unit: TemperatureUnit
}

function CurrentWeather({ location, weather, unit }: CurrentWeatherProps) {
  const condition = getWeatherCondition(weather.weatherCode, weather.isDay)

  return (
    <section aria-labelledby="location-title">
      <LocationHeader location={location} />

      <div className="mt-8 sm:mt-10">
        <p
          data-testid="current-temperature"
          className="flex items-start font-semibold tracking-tighter tabular-nums"
        >
          <span className="text-8xl leading-none sm:text-9xl">
            {roundTemperature(weather.temperature, unit)}
          </span>
          <span className="mt-2 text-3xl font-medium text-ink-muted sm:mt-3 sm:text-4xl">
            {formatUnitSymbol(unit)}
          </span>
        </p>

        <p className="mt-4 flex items-center gap-2 text-lg font-medium">
          <WeatherIcon name={condition.icon} className="size-6 shrink-0 text-ink-muted" />
          {condition.label}
        </p>
      </div>

      <div className="mt-10 sm:mt-12">
        <WeatherDetails weather={weather} unit={unit} />
      </div>
    </section>
  )
}

export default CurrentWeather
