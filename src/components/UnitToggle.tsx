import type { TemperatureUnit } from '../types/weather.ts'

const OPTIONS: { unit: TemperatureUnit; symbol: string; name: string }[] = [
  { unit: 'celsius', symbol: '°C', name: 'Celsius' },
  { unit: 'fahrenheit', symbol: '°F', name: 'Fahrenheit' },
]

interface UnitToggleProps {
  unit: TemperatureUnit
  onChange: (unit: TemperatureUnit) => void
}

/**
 * A two-option segmented control built from native radio buttons, so arrow
 * keys, focus and screen-reader announcements ("Celsius, selected, 1 of 2")
 * work without extra code.
 */
function UnitToggle({ unit, onChange }: UnitToggleProps) {
  return (
    <fieldset className="flex rounded-xl border border-line-strong p-0.5">
      <legend className="sr-only">Temperature unit</legend>
      {OPTIONS.map((option) => (
        <label
          key={option.unit}
          className="flex h-8 min-w-10 cursor-pointer items-center justify-center rounded-[10px] px-2.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink has-checked:bg-ink has-checked:text-canvas has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
        >
          <input
            type="radio"
            name="temperature-unit"
            value={option.unit}
            checked={unit === option.unit}
            onChange={() => onChange(option.unit)}
            className="sr-only"
          />
          <span aria-hidden="true">{option.symbol}</span>
          <span className="sr-only">{option.name}</span>
        </label>
      ))}
    </fieldset>
  )
}

export default UnitToggle
