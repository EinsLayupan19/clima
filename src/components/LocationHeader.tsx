import { formatLocationSubtitle } from '../lib/weatherUtils.ts'
import type { Location } from '../types/weather.ts'

interface LocationHeaderProps {
  location: Location
}

function LocationHeader({ location }: LocationHeaderProps) {
  const subtitle = formatLocationSubtitle(location)

  return (
    <div>
      <h1
        id="location-title"
        className="text-3xl font-semibold tracking-tight text-balance wrap-break-word sm:text-4xl"
      >
        {location.name}
      </h1>
      {subtitle && <p className="mt-1 text-base text-ink-muted sm:text-lg">{subtitle}</p>}
    </div>
  )
}

export default LocationHeader
