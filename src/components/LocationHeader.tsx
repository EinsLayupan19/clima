import { formatLocationSubtitle } from '../lib/weatherUtils.ts'
import type { Location } from '../types/weather.ts'

interface LocationHeaderProps {
  location: Location
}

function LocationHeader({ location }: LocationHeaderProps) {
  const subtitle = formatLocationSubtitle(location)

  return (
    <section aria-labelledby="location-title">
      <h1
        id="location-title"
        className="text-5xl font-semibold tracking-tighter text-balance wrap-break-word sm:text-6xl"
      >
        {location.name}
      </h1>
      {subtitle && <p className="mt-3 text-lg text-ink-muted">{subtitle}</p>}
    </section>
  )
}

export default LocationHeader
