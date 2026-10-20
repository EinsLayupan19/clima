// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadTemperatureUnit, saveTemperatureUnit } from './unitPreference.ts'

const KEY = 'clima.temperatureUnit'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('loadTemperatureUnit', () => {
  it('defaults to Celsius when nothing is saved', () => {
    expect(loadTemperatureUnit()).toBe('celsius')
  })

  it('returns a saved Fahrenheit preference', () => {
    localStorage.setItem(KEY, 'fahrenheit')

    expect(loadTemperatureUnit()).toBe('fahrenheit')
  })

  it('ignores a saved value it does not recognise', () => {
    localStorage.setItem(KEY, 'kelvin')

    expect(loadTemperatureUnit()).toBe('celsius')
  })

  it('falls back to Celsius when storage cannot be read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError: storage is disabled')
    })

    expect(loadTemperatureUnit()).toBe('celsius')
  })
})

describe('saveTemperatureUnit', () => {
  it('stores the chosen unit', () => {
    saveTemperatureUnit('fahrenheit')

    expect(localStorage.getItem(KEY)).toBe('fahrenheit')
  })

  it('does not throw when storage is full or blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    expect(() => saveTemperatureUnit('fahrenheit')).not.toThrow()
  })
})
