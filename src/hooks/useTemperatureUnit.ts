import { useCallback, useState } from 'react'
import { loadTemperatureUnit, saveTemperatureUnit } from '../lib/unitPreference.ts'
import type { TemperatureUnit } from '../types/weather.ts'

/** The user's temperature unit, remembered between visits. */
export function useTemperatureUnit() {
  const [unit, setUnitState] = useState<TemperatureUnit>(loadTemperatureUnit)

  const setUnit = useCallback((nextUnit: TemperatureUnit) => {
    setUnitState(nextUnit)
    saveTemperatureUnit(nextUnit)
  }, [])

  return [unit, setUnit] as const
}
