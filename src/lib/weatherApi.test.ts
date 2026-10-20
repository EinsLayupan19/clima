import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, fetchJson, searchLocation } from './weatherApi.ts'

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
