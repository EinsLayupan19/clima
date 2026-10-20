import { describe, expect, it } from 'vitest'
import { formatLocationSubtitle, normalizeQuery } from './weatherUtils.ts'

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
