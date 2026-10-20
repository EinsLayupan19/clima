import { describe, expect, it } from 'vitest'
import {
  convertTemperature,
  formatDayLabel,
  formatLocationSubtitle,
  formatShortDate,
  formatPercent,
  formatTemperature,
  formatUnitSymbol,
  formatWindSpeed,
  getWeatherCondition,
  normalizeQuery,
  roundTemperature,
} from './weatherUtils.ts'

describe('normalizeQuery', () => {
  it('trims the ends and collapses repeated spaces', () => {
    expect(normalizeQuery('   New    York  ')).toBe('New York')
  })

  it('returns an empty string for whitespace-only input', () => {
    expect(normalizeQuery(' \t  ')).toBe('')
  })

  it('keeps accents and punctuation intact', () => {
    expect(normalizeQuery("Reykjavík, Iceland")).toBe('Reykjavík, Iceland')
  })
})

describe('formatLocationSubtitle', () => {
  it('joins the region and country', () => {
    const location = {
      id: 1,
      name: 'Manila',
      region: 'National Capital Region',
      country: 'Philippines',
      latitude: 0,
      longitude: 0,
    }

    expect(formatLocationSubtitle(location)).toBe('National Capital Region, Philippines')
  })

  it('skips a region that repeats the city name', () => {
    const location = {
      id: 2,
      name: 'Tokyo',
      region: 'Tokyo',
      country: 'Japan',
      latitude: 0,
      longitude: 0,
    }

    expect(formatLocationSubtitle(location)).toBe('Japan')
  })

  it('returns an empty string when there is no region or country', () => {
    const location = { id: 3, name: 'Nowhere', latitude: 0, longitude: 0 }

    expect(formatLocationSubtitle(location)).toBe('')
  })
})

describe('getWeatherCondition', () => {
  it.each([
    [0, true, 'Clear sky', 'clear-day'],
    [0, false, 'Clear sky', 'clear-night'],
    [1, true, 'Mainly clear', 'partly-cloudy-day'],
    [2, false, 'Partly cloudy', 'partly-cloudy-night'],
    [3, true, 'Overcast', 'cloudy'],
    [45, true, 'Fog', 'fog'],
    [48, true, 'Freezing fog', 'fog'],
    [53, true, 'Drizzle', 'rain'],
    [57, true, 'Freezing drizzle', 'rain'],
    [61, true, 'Light rain', 'rain'],
    [65, true, 'Heavy rain', 'rain'],
    [67, true, 'Freezing rain', 'rain'],
    [73, true, 'Snow', 'snow'],
    [77, true, 'Snow grains', 'snow'],
    [81, true, 'Rain showers', 'rain'],
    [86, true, 'Heavy snow showers', 'snow'],
    [95, true, 'Thunderstorm', 'thunderstorm'],
    [99, false, 'Thunderstorm with heavy hail', 'thunderstorm'],
  ] as const)('maps code %i (day: %s) to “%s”', (code, isDay, label, icon) => {
    expect(getWeatherCondition(code, isDay)).toEqual({ label, icon })
  })

  it('falls back to a neutral label for codes it does not know', () => {
    expect(getWeatherCondition(42, true)).toEqual({ label: 'Unknown conditions', icon: 'unknown' })
  })
})

describe('formatTemperature', () => {
  it('rounds to a whole degree', () => {
    expect(formatTemperature(34.4, 'celsius')).toBe('34°')
  })

  it('rounds negative temperatures', () => {
    expect(formatTemperature(-7.6, 'celsius')).toBe('-8°')
  })

  it('never shows a negative zero', () => {
    expect(formatTemperature(-0.4, 'celsius')).toBe('0°')
  })

  it('converts to Fahrenheit before rounding', () => {
    expect(formatTemperature(34.4, 'fahrenheit')).toBe('94°')
  })

  it('never shows a negative zero in Fahrenheit either', () => {
    // -17.9°C is -0.22°F, which rounds to -0.
    expect(formatTemperature(-17.9, 'fahrenheit')).toBe('0°')
  })
})

describe('convertTemperature', () => {
  it('leaves Celsius values unchanged', () => {
    expect(convertTemperature(21.5, 'celsius')).toBe(21.5)
  })

  it('converts the boiling point to 212°F', () => {
    expect(convertTemperature(100, 'fahrenheit')).toBe(212)
  })

  it('converts -40°C to -40°F', () => {
    expect(convertTemperature(-40, 'fahrenheit')).toBe(-40)
  })
})

describe('roundTemperature', () => {
  it('rounds in the requested unit', () => {
    expect(roundTemperature(34.4, 'celsius')).toBe(34)
    expect(roundTemperature(34.4, 'fahrenheit')).toBe(94)
  })
})

describe('formatUnitSymbol', () => {
  it('names the unit with a degree sign', () => {
    expect(formatUnitSymbol('celsius')).toBe('°C')
    expect(formatUnitSymbol('fahrenheit')).toBe('°F')
  })
})

describe('formatWindSpeed', () => {
  it('rounds to a whole number in km/h', () => {
    expect(formatWindSpeed(3.1)).toBe('3 km/h')
  })
})

describe('formatDayLabel', () => {
  it('says Today for the current day', () => {
    expect(formatDayLabel('2026-10-20', true)).toBe('Today')
  })

  it('uses the short weekday name for other days', () => {
    expect(formatDayLabel('2026-10-21', false)).toBe('Wed')
  })

  it('reads the date as a calendar day, not shifted by time zone', () => {
    // 1 January 2026 is a Thursday everywhere; a UTC shift would make it Wednesday.
    expect(formatDayLabel('2026-01-01', false)).toBe('Thu')
  })
})

describe('formatShortDate', () => {
  it('shows the month and day', () => {
    expect(formatShortDate('2026-10-21')).toBe('Oct 21')
  })

  it('keeps the first of the month on the right day', () => {
    expect(formatShortDate('2026-01-01')).toBe('Jan 1')
  })
})

describe('formatPercent', () => {
  it('rounds to a whole percentage', () => {
    expect(formatPercent(48.6)).toBe('49%')
  })
})
