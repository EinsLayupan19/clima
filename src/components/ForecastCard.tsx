import {
  formatDayLabel,
  formatShortDate,
  formatTemperature,
  getWeatherCondition,
} from '../lib/weatherUtils.ts'
import type { DailyForecast, TemperatureUnit } from '../types/weather.ts'
import WeatherIcon from './WeatherIcon.tsx'

interface ForecastCardProps {
  day: DailyForecast
  unit: TemperatureUnit
}

/**
 * One forecast day. A compact row on phones; a centered column from md up,
 * where the forecast is laid out horizontally.
 */
function ForecastCard({ day, unit }: ForecastCardProps) {
  const condition = getWeatherCondition(day.weatherCode, true)

  return (
    <div className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-x-4 py-3 md:flex md:h-full md:flex-col md:gap-2 md:py-0 md:text-center">
      <p className="flex flex-col leading-snug md:items-center">
        <span className="font-medium">{formatDayLabel(day.date, day.isToday)}</span>
        <time dateTime={day.date} className="text-sm text-ink-muted">
          {formatShortDate(day.date)}
        </time>
      </p>

      <p className="flex min-w-0 items-center gap-2 text-ink-muted md:flex-col md:text-sm md:text-balance">
        <WeatherIcon name={condition.icon} className="size-6 shrink-0 md:my-1 md:size-7 md:text-ink" />
        <span>{condition.label}</span>
      </p>

      <p className="flex justify-end gap-3 tabular-nums md:mt-auto md:justify-center md:gap-2">
        <span className="font-medium">
          <span className="sr-only">High </span>
          {formatTemperature(day.high, unit)}
        </span>
        <span className="text-ink-muted">
          <span className="sr-only">Low </span>
          {formatTemperature(day.low, unit)}
        </span>
      </p>
    </div>
  )
}

export default ForecastCard
