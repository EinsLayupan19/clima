import type { DailyForecast, TemperatureUnit } from '../types/weather.ts'
import ForecastCard from './ForecastCard.tsx'

interface ForecastProps {
  days: DailyForecast[]
  unit: TemperatureUnit
}

function Forecast({ days, unit }: ForecastProps) {
  return (
    <section aria-labelledby="forecast-title">
      <h2 id="forecast-title" className="text-lg font-semibold tracking-tight">
        7-day forecast
      </h2>

      {days.length === 0 ? (
        <p className="mt-3 text-base text-ink-muted">The forecast isn’t available right now.</p>
      ) : (
        <ol className="mt-3 border-t border-line pt-3 md:mt-4 md:grid md:grid-cols-7 md:gap-2 md:pt-6">
          {days.map((day) => (
            <li key={day.date}>
              <ForecastCard day={day} unit={unit} />
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export default Forecast
