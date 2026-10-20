import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, fetchJson, getWeather, searchLocation } from './weatherApi.ts'

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response
}

const manilaResult = {
  id: 1701668,
  name: 'Manila',
  latitude: 14.6042,
  longitude: 120.9822,
  feature_code: 'PPLC',
  country_code: 'PH',
  timezone: 'Asia/Manila',
  country: 'Philippines',
  admin1: 'National Capital Region',
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('searchLocation', () => {
  it('returns the best match as an app-friendly location', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ results: [manilaResult] })))

    const location = await searchLocation('Manila')

    expect(location).toEqual({
      id: 1701668,
      name: 'Manila',
      region: 'National Capital Region',
      country: 'Philippines',
      latitude: 14.6042,
      longitude: 120.9822,
    })
  })

  it('requests a single English result with the city name URL-encoded', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ results: [manilaResult] }))
    vi.stubGlobal('fetch', fetchMock)

    await searchLocation('São Paulo')

    const url = new URL(fetchMock.mock.calls[0][0])
    expect(url.origin + url.pathname).toBe('https://geocoding-api.open-meteo.com/v1/search')
    expect(url.searchParams.get('name')).toBe('São Paulo')
    expect(url.searchParams.get('count')).toBe('1')
    expect(url.searchParams.get('language')).toBe('en')
  })

  it('leaves out region and country when the API does not provide them', async () => {
    const { admin1: _admin1, country: _country, ...bare } = manilaResult
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ results: [bare] })))

    const location = await searchLocation('Manila')

    expect(location).toEqual({
      id: 1701668,
      name: 'Manila',
      latitude: 14.6042,
      longitude: 120.9822,
    })
  })

  it('returns null when no city matches', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ generationtime_ms: 0.15 })))

    expect(await searchLocation('zzqxqx')).toBeNull()
  })

  it('returns null when the results list is empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ results: [] })))

    expect(await searchLocation('zzqxqx')).toBeNull()
  })

  it('throws an invalid-response error when a result has no coordinates', async () => {
    const { latitude: _latitude, ...broken } = manilaResult
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ results: [broken] })))

    await expect(searchLocation('Manila')).rejects.toMatchObject({ kind: 'invalid-response' })
  })

  it('throws an invalid-response error when results is not a list', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ results: 'nope' })))

    await expect(searchLocation('Manila')).rejects.toMatchObject({ kind: 'invalid-response' })
  })
})

const manilaForecast = {
  latitude: 14.586995,
  longitude: 121.002785,
  current_units: { temperature_2m: '°C', wind_speed_10m: 'km/h' },
  current: {
    time: '2026-10-20T11:45',
    interval: 900,
    temperature_2m: 34.4,
    relative_humidity_2m: 49,
    apparent_temperature: 40.8,
    is_day: 1,
    precipitation_probability: 29,
    weather_code: 1,
    wind_speed_10m: 3.1,
  },
  daily: {
    time: [
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
      '2026-10-26',
    ],
    weather_code: [51, 53, 51, 51, 51, 3, 53],
    temperature_2m_max: [34.5, 32.9, 33.5, 32.6, 32.3, 33.1, 33.0],
    temperature_2m_min: [27.3, 27.2, 27.5, 28.2, 26.9, 25.9, 25.6],
  },
}

describe('getWeather: daily forecast', () => {
  const manila = { latitude: 14.6042, longitude: 120.9822 }

  it('returns each forecast day with its date, condition code, high and low', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(manilaForecast)))

    const { forecast } = await getWeather(manila)

    expect(forecast).toHaveLength(7)
    expect(forecast[0]).toEqual({
      date: '2026-10-20',
      isToday: true,
      weatherCode: 51,
      high: 34.5,
      low: 27.3,
    })
    expect(forecast[6]).toEqual({
      date: '2026-10-26',
      isToday: false,
      weatherCode: 53,
      high: 33.0,
      low: 25.6,
    })
  })

  it('asks for 7 days of daily data in the location’s own time zone', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(manilaForecast))
    vi.stubGlobal('fetch', fetchMock)

    await getWeather(manila)

    const url = new URL(fetchMock.mock.calls[0][0])
    expect(url.searchParams.get('daily')?.split(',')).toEqual(
      expect.arrayContaining(['weather_code', 'temperature_2m_max', 'temperature_2m_min']),
    )
    expect(url.searchParams.get('forecast_days')).toBe('7')
    expect(url.searchParams.get('timezone')).toBe('auto')
  })

  it('skips days with missing or invalid values and keeps the rest', async () => {
    const daily = {
      ...manilaForecast.daily,
      time: ['2026-10-20', 'not-a-date', ...manilaForecast.daily.time.slice(2)],
      temperature_2m_max: [34.5, 32.9, null, ...manilaForecast.daily.temperature_2m_max.slice(3)],
      weather_code: [51, 53, 51, 'rain', ...manilaForecast.daily.weather_code.slice(4)],
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ ...manilaForecast, daily })))

    const { forecast } = await getWeather(manila)

    expect(forecast.map((day) => day.date)).toEqual([
      '2026-10-20',
      '2026-10-24',
      '2026-10-25',
      '2026-10-26',
    ])
  })

  it('only marks the location’s first forecast date as today', async () => {
    const daily = {
      ...manilaForecast.daily,
      temperature_2m_min: [null, ...manilaForecast.daily.temperature_2m_min.slice(1)],
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ ...manilaForecast, daily })))

    const { forecast } = await getWeather(manila)

    expect(forecast[0].date).toBe('2026-10-21')
    expect(forecast.some((day) => day.isToday)).toBe(false)
  })

  it('returns an empty forecast but keeps current conditions when daily data is missing', async () => {
    const { daily: _daily, ...withoutDaily } = manilaForecast
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(withoutDaily)))

    const weather = await getWeather(manila)

    expect(weather.forecast).toEqual([])
    expect(weather.current.temperature).toBe(34.4)
  })

  it('returns an empty forecast when the daily data is not in list form', async () => {
    const daily = { ...manilaForecast.daily, time: '2026-10-20' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ ...manilaForecast, daily })))

    const { forecast } = await getWeather(manila)

    expect(forecast).toEqual([])
  })
})

describe('getWeather: current conditions', () => {
  const manila = { latitude: 14.6042, longitude: 120.9822 }

  it('returns current conditions as app-friendly data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(manilaForecast)))

    const weather = await getWeather(manila)

    expect(weather.current).toEqual({
      temperature: 34.4,
      feelsLike: 40.8,
      humidity: 49,
      windSpeed: 3.1,
      precipitationChance: 29,
      weatherCode: 1,
      isDay: true,
    })
  })

  it('requests the location’s current conditions in Celsius and km/h', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(manilaForecast))
    vi.stubGlobal('fetch', fetchMock)

    await getWeather(manila)

    const url = new URL(fetchMock.mock.calls[0][0])
    expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast')
    expect(url.searchParams.get('latitude')).toBe('14.6042')
    expect(url.searchParams.get('longitude')).toBe('120.9822')
    expect(url.searchParams.get('temperature_unit')).toBe('celsius')
    expect(url.searchParams.get('wind_speed_unit')).toBe('kmh')
    expect(url.searchParams.get('current')?.split(',')).toEqual(
      expect.arrayContaining(['temperature_2m', 'weather_code', 'precipitation_probability']),
    )
  })

  it('reports night time when is_day is 0', async () => {
    const night = { ...manilaForecast, current: { ...manilaForecast.current, is_day: 0 } }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(night)))

    const weather = await getWeather(manila)

    expect(weather.current.isDay).toBe(false)
  })

  it('uses null for optional values the API leaves out or sends as null', async () => {
    const {
      relative_humidity_2m: _humidity,
      apparent_temperature: _feelsLike,
      ...current
    } = manilaForecast.current
    const sparse = {
      ...manilaForecast,
      current: { ...current, precipitation_probability: null, wind_speed_10m: null },
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(sparse)))

    const weather = await getWeather(manila)

    expect(weather.current).toMatchObject({
      feelsLike: null,
      humidity: null,
      windSpeed: null,
      precipitationChance: null,
    })
  })

  it('throws an invalid-response error when the temperature is missing', async () => {
    const { temperature_2m: _temperature, ...current } = manilaForecast.current
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ ...manilaForecast, current })))

    await expect(getWeather(manila)).rejects.toMatchObject({ kind: 'invalid-response' })
  })

  it('throws an invalid-response error when the weather code is missing', async () => {
    const { weather_code: _code, ...current } = manilaForecast.current
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ ...manilaForecast, current })))

    await expect(getWeather(manila)).rejects.toMatchObject({ kind: 'invalid-response' })
  })

  it('throws an invalid-response error when there is no current block', async () => {
    const { current: _current, ...rest } = manilaForecast
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(rest)))

    await expect(getWeather(manila)).rejects.toMatchObject({ kind: 'invalid-response' })
  })

  it('throws a server error when the API rejects the request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: true, reason: 'Latitude out of range' }, 400)),
    )

    await expect(getWeather(manila)).rejects.toMatchObject({ kind: 'server' })
  })
})

describe('fetchJson', () => {
  it('returns the parsed JSON body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ hello: 'world' })))

    expect(await fetchJson('https://example.test')).toEqual({ hello: 'world' })
  })

  it('throws a network error when the request cannot be sent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const error = await fetchJson('https://example.test').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: 'network' })
  })

  it('throws a server error for a non-OK HTTP status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: true, reason: 'Bad count' }, 400)),
    )

    await expect(fetchJson('https://example.test')).rejects.toMatchObject({ kind: 'server' })
  })

  it('throws an invalid-response error when the body is not JSON', async () => {
    const notJson = {
      ok: true,
      status: 200,
      json: () => Promise.reject(new SyntaxError('Unexpected token <')),
    } as Response
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(notJson))

    await expect(fetchJson('https://example.test')).rejects.toMatchObject({
      kind: 'invalid-response',
    })
  })

  it('throws a timeout error when the server takes too long', async () => {
    vi.stubGlobal('fetch', neverRespondingFetch())

    await expect(fetchJson('https://example.test', { timeoutMs: 10 })).rejects.toMatchObject({
      kind: 'timeout',
    })
  })

  it('passes a caller abort through untouched so callers can ignore it', async () => {
    vi.stubGlobal('fetch', neverRespondingFetch())
    const controller = new AbortController()

    const request = fetchJson('https://example.test', { signal: controller.signal })
    controller.abort()
    const error = await request.catch((e: unknown) => e)

    expect(error).not.toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ name: 'AbortError' })
  })
})

/** A fetch that only settles when its signal aborts, like a hung request. */
function neverRespondingFetch() {
  return vi.fn(
    (_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
      }),
  )
}
