import { DropIcon, ThermometerIcon, UmbrellaIcon, WindIcon, type Icon } from '@phosphor-icons/react'
import { formatPercent, formatTemperature, formatWindSpeed } from '../lib/weatherUtils.ts'
import type { CurrentWeather, TemperatureUnit } from '../types/weather.ts'

interface Detail {
  label: string
  value: string
  icon: Icon
}

interface WeatherDetailsProps {
  weather: CurrentWeather
  unit: TemperatureUnit
}

function WeatherDetails({ weather, unit }: WeatherDetailsProps) {
  const details: Detail[] = []
  if (weather.feelsLike !== null) {
    details.push({
      label: 'Feels like',
      value: formatTemperature(weather.feelsLike, unit),
      icon: ThermometerIcon,
    })
  }
  if (weather.humidity !== null) {
    details.push({ label: 'Humidity', value: formatPercent(weather.humidity), icon: DropIcon })
  }
  if (weather.windSpeed !== null) {
    details.push({ label: 'Wind', value: formatWindSpeed(weather.windSpeed), icon: WindIcon })
  }
  if (weather.precipitationChance !== null) {
    details.push({
      label: 'Precipitation',
      value: formatPercent(weather.precipitationChance),
      icon: UmbrellaIcon,
    })
  }

  if (details.length === 0) return null

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-6 border-t border-line pt-6 sm:grid-cols-4">
      {details.map(({ label, value, icon: DetailIcon }) => (
        <div key={label}>
          <dt className="flex items-center gap-1.5 text-sm text-ink-muted">
            <DetailIcon aria-hidden="true" className="size-4 shrink-0" />
            {label}
          </dt>
          <dd className="mt-1 text-2xl font-medium tracking-tight tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export default WeatherDetails
