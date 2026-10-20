// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response
}

function geocodingResult(name: string, admin1: string, country: string) {
  return { id: name.length, name, latitude: 10, longitude: 20, admin1, country }
}

const sevenDays = {
  time: [
    '2026-10-20',
    '2026-10-21',
    '2026-10-22',
    '2026-10-23',
    '2026-10-24',
    '2026-10-25',
    '2026-10-26',
  ],
  weather_code: [51, 63, 95, 3, 0, 2, 45],
  temperature_2m_max: [34.5, 32.9, 33.5, 32.6, 32.3, 33.1, 33.0],
  temperature_2m_min: [27.3, 27.2, 27.5, 28.2, 26.9, 25.9, 25.6],
}

/** An Open-Meteo forecast response. Pass `daily: null` to leave the forecast out. */
function forecastResult(
  current: Record<string, number | null> = {},
  daily: Record<string, unknown> | null = sevenDays,
) {
  return {
    current: {
      temperature_2m: 34.4,
      apparent_temperature: 40.8,
      relative_humidity_2m: 49,
      wind_speed_10m: 3.1,
      precipitation_probability: 29,
      weather_code: 1,
      is_day: 1,
      ...current,
    },
    ...(daily && { daily }),
  }
}

/**
 * Stubs fetch with one handler per Open-Meteo endpoint.
 * Each handler receives the request URL and returns the response.
 */
function stubOpenMeteo(handlers: {
  geocoding: (url: URL) => Promise<Response>
  forecast?: (url: URL) => Promise<Response>
}) {
  const fetchMock = vi.fn((input: string) => {
    const url = new URL(input)
    if (url.hostname === 'geocoding-api.open-meteo.com') return handlers.geocoding(url)
    if (handlers.forecast) return handlers.forecast(url)
    throw new Error(`Unexpected request: ${input}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('App layout', () => {
  it('renders the page landmarks', () => {
    render(<App />)

    expect(screen.getByRole('banner')).toBeTruthy()
    expect(screen.getByRole('main')).toBeTruthy()
    expect(screen.getByRole('contentinfo')).toBeTruthy()
  })

  it('starts with a single top-level heading', () => {
    render(<App />)

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('credits Open-Meteo as the weather data source', () => {
    render(<App />)

    const link = screen.getByRole('link', { name: 'Open-Meteo (opens in a new tab)' })
    expect(link.getAttribute('href')).toBe('https://open-meteo.com')
  })

  it('starts with the app name as the page title', () => {
    render(<App />)

    expect(document.title).toBe('Clima')
  })
})

describe('City search', () => {
  it('searches when Enter is pressed and shows the location', async () => {
    stubOpenMeteo({
      geocoding: async () =>
        jsonResponse({
          results: [geocodingResult('Manila', 'National Capital Region', 'Philippines')],
        }),
      forecast: async () => jsonResponse(forecastResult()),
    })
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('City'), 'Manila{Enter}')

    expect(await screen.findByRole('heading', { level: 1, name: 'Manila' })).toBeTruthy()
    expect(screen.getByText('National Capital Region, Philippines')).toBeTruthy()
  })

  it('searches when the Search button is clicked', async () => {
    stubOpenMeteo({
      geocoding: async () =>
        jsonResponse({ results: [geocodingResult('New York', 'New York', 'United States')] }),
      forecast: async () => jsonResponse(forecastResult()),
    })
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('City'), 'New York')
    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'New York' })).toBeTruthy()
  })

  it('announces that it is searching while the request is in flight', async () => {
    stubOpenMeteo({ geocoding: () => new Promise<Response>(() => {}) })
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('City'), 'Manila{Enter}')

    expect(screen.getByRole('status').textContent).toBe('Searching for Manila…')
  })

  it('asks for a city name instead of searching when the input is blank', async () => {
    const fetchMock = stubOpenMeteo({ geocoding: async () => jsonResponse({}) })
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('City'), '   ')
    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(screen.getByText('Enter a city name to search.')).toBeTruthy()
    expect(screen.getByLabelText('City').getAttribute('aria-invalid')).toBe('true')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('clears the blank-input message once the user starts typing', async () => {
    stubOpenMeteo({ geocoding: async () => jsonResponse({}) })
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Search' }))
    await user.type(screen.getByLabelText('City'), 'L')

    expect(screen.queryByText('Enter a city name to search.')).toBeNull()
  })

  it('tells the user when no city matches, without asking for weather', async () => {
    const fetchMock = stubOpenMeteo({
      geocoding: async () => jsonResponse({ generationtime_ms: 0.1 }),
    })
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('City'), 'Zzqxqx{Enter}')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'No results for “Zzqxqx”' }),
    ).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('shows a connection error and recovers when Try again is pressed', async () => {
    const geocoding = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(
        jsonResponse({ results: [geocodingResult('Lima', 'Lima region', 'Peru')] }),
      )
    stubOpenMeteo({ geocoding, forecast: async () => jsonResponse(forecastResult()) })
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('City'), 'Lima{Enter}')
    expect(await screen.findByRole('heading', { level: 1, name: 'Couldn’t connect' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Lima' })).toBeTruthy()
  })

  it('shows only the latest result when searches overlap', async () => {
    let resolveSlowSearch: (response: Response) => void = () => {}
    stubOpenMeteo({
      geocoding: (url) =>
        url.searchParams.get('name') === 'Paris'
          ? new Promise<Response>((resolve) => (resolveSlowSearch = resolve))
          : Promise.resolve(jsonResponse({ results: [geocodingResult('Oslo', 'Oslo', 'Norway')] })),
      forecast: async () => jsonResponse(forecastResult()),
    })
    const user = userEvent.setup()
    render(<App />)
    const input = screen.getByLabelText('City')

    await user.type(input, 'Paris{Enter}')
    await user.clear(input)
    await user.type(input, 'Oslo{Enter}')
    await screen.findByRole('heading', { level: 1, name: 'Oslo' })
    resolveSlowSearch(jsonResponse({ results: [geocodingResult('Paris', 'Île-de-France', 'France')] }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Oslo' })).toBeTruthy()
    expect(screen.queryByRole('heading', { level: 1, name: 'Paris' })).toBeNull()
  })

  it('searches an example city from the empty state', async () => {
    stubOpenMeteo({
      geocoding: async () =>
        jsonResponse({ results: [geocodingResult('Tokyo', 'Tokyo', 'Japan')] }),
      forecast: async () => jsonResponse(forecastResult()),
    })
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Tokyo' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Tokyo' })).toBeTruthy()
    expect((screen.getByLabelText('City') as HTMLInputElement).value).toBe('Tokyo')
  })
})

describe('Current weather', () => {
  it('asks for the weather at the coordinates the city search returned', async () => {
    const fetchMock = stubOpenMeteo({
      geocoding: async () =>
        jsonResponse({
          results: [{ id: 1, name: 'Manila', latitude: 14.6042, longitude: 120.9822 }],
        }),
      forecast: async () => jsonResponse(forecastResult()),
    })
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('City'), 'Manila{Enter}')
    await screen.findByRole('heading', { level: 1, name: 'Manila' })

    const forecastUrl = new URL(fetchMock.mock.calls[1][0])
    expect(forecastUrl.searchParams.get('latitude')).toBe('14.6042')
    expect(forecastUrl.searchParams.get('longitude')).toBe('120.9822')
  })

  it('shows the temperature, condition and details for the city', async () => {
    stubOpenMeteo({
      geocoding: async () =>
        jsonResponse({
          results: [geocodingResult('Manila', 'National Capital Region', 'Philippines')],
        }),
      forecast: async () => jsonResponse(forecastResult()),
    })
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('City'), 'Manila{Enter}')
    await screen.findByRole('heading', { level: 1, name: 'Manila' })

    expect(screen.getByTestId('current-temperature').textContent).toBe('34°C')
    expect(screen.getByText('Mainly clear')).toBeTruthy()
    expect(detailValue('Feels like')).toBe('41°')
    expect(detailValue('Humidity')).toBe('49%')
    expect(detailValue('Wind')).toBe('3 km/h')
    expect(detailValue('Precipitation')).toBe('29%')
  })

  it('announces the result to screen readers', async () => {
    stubOpenMeteo({
      geocoding: async () =>
        jsonResponse({
          results: [geocodingResult('Manila', 'National Capital Region', 'Philippines')],
        }),
      forecast: async () => jsonResponse(forecastResult()),
    })
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('City'), 'Manila{Enter}')
    await screen.findByRole('heading', { level: 1, name: 'Manila' })

    expect(screen.getByRole('status').textContent).toBe(
      'Showing weather for Manila, National Capital Region, Philippines: 34°C, mainly clear.',
    )
  })

  it('names the page after the city, and resets when a search finds nothing', async () => {
    stubOpenMeteo({
      geocoding: async (url) =>
        jsonResponse(
          url.searchParams.get('name') === 'Manila'
            ? { results: [geocodingResult('Manila', 'National Capital Region', 'Philippines')] }
            : {},
        ),
      forecast: async () => jsonResponse(forecastResult()),
    })
    const user = userEvent.setup()
    render(<App />)
    const input = screen.getByLabelText('City')

    await user.type(input, 'Manila{Enter}')
    await screen.findByRole('heading', { level: 1, name: 'Manila' })
    expect(document.title).toBe('Manila weather - Clima')

    await user.clear(input)
    await user.type(input, 'Zzqxqx{Enter}')
    await screen.findByRole('heading', { level: 1, name: 'No results for “Zzqxqx”' })
    expect(document.title).toBe('Clima')
  })

  it('leaves out details the API did not provide', async () => {
    stubOpenMeteo({
      geocoding: async () =>
        jsonResponse({ results: [geocodingResult('Reykjavik', 'Capital Region', 'Iceland')] }),
      forecast: async () =>
        jsonResponse(forecastResult({ precipitation_probability: null, wind_speed_10m: null })),
    })
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('City'), 'Reykjavik{Enter}')
    await screen.findByRole('heading', { level: 1, name: 'Reykjavik' })

    expect(screen.queryByText('Precipitation')).toBeNull()
    expect(screen.queryByText('Wind')).toBeNull()
    expect(detailValue('Humidity')).toBe('49%')
  })

  it('shows an error when the weather request fails, and recovers on Try again', async () => {
    const forecast = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: true, reason: 'Server error' }, 500))
      .mockResolvedValueOnce(jsonResponse(forecastResult()))
    stubOpenMeteo({
      geocoding: async () =>
        jsonResponse({ results: [geocodingResult('Lima', 'Lima region', 'Peru')] }),
      forecast,
    })
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('City'), 'Lima{Enter}')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Lima' })).toBeTruthy()
    expect(screen.getByTestId('current-temperature').textContent).toBe('34°C')
  })

  it('shows an error when the weather data is unreadable', async () => {
    stubOpenMeteo({
      geocoding: async () =>
        jsonResponse({ results: [geocodingResult('Lima', 'Lima region', 'Peru')] }),
      forecast: async () => jsonResponse({ current: { weather_code: 1 } }),
    })
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('City'), 'Lima{Enter}')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toBeTruthy()
    expect(screen.getByText(/sent back data we couldn’t read/)).toBeTruthy()
  })
})

describe('Forecast', () => {
  function stubManila(forecast: object) {
    stubOpenMeteo({
      geocoding: async () =>
        jsonResponse({
          results: [geocodingResult('Manila', 'National Capital Region', 'Philippines')],
        }),
      forecast: async () => jsonResponse(forecast),
    })
  }

  async function searchManila() {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByLabelText('City'), 'Manila{Enter}')
    await screen.findByRole('heading', { level: 1, name: 'Manila' })
  }

  it('lists seven days, starting with today', async () => {
    stubManila(forecastResult())

    await searchManila()

    const days = within(screen.getByRole('region', { name: '7-day forecast' })).getAllByRole(
      'listitem',
    )
    expect(days).toHaveLength(7)
    expect(days[0].textContent).toContain('Today')
    expect(days[0].textContent).toContain('Oct 20')
    expect(days[1].textContent).toContain('Wed')
    expect(days[1].textContent).toContain('Oct 21')
  })

  it('shows each day’s condition, high and low', async () => {
    stubManila(forecastResult())

    await searchManila()

    const days = within(screen.getByRole('region', { name: '7-day forecast' })).getAllByRole(
      'listitem',
    )
    expect(within(days[1]).getByText('Rain')).toBeTruthy()
    expect(days[1].textContent).toContain('High 33°')
    expect(days[1].textContent).toContain('Low 27°')
    expect(within(days[2]).getByText('Thunderstorm')).toBeTruthy()
    expect(within(days[6]).getByText('Fog')).toBeTruthy()
  })

  it('leaves out days with unreadable data', async () => {
    stubManila(
      forecastResult(
        {},
        { ...sevenDays, temperature_2m_max: [34.5, null, 33.5, 32.6, 32.3, 33.1, 33.0] },
      ),
    )

    await searchManila()

    const days = within(screen.getByRole('region', { name: '7-day forecast' })).getAllByRole(
      'listitem',
    )
    expect(days).toHaveLength(6)
    expect(days[1].textContent).toContain('Thu')
  })

  it('keeps the current weather and explains when the forecast is unavailable', async () => {
    stubManila(forecastResult({}, null))

    await searchManila()

    expect(screen.getByTestId('current-temperature').textContent).toBe('34°C')
    const forecast = screen.getByRole('region', { name: '7-day forecast' })
    expect(within(forecast).getByText('The forecast isn’t available right now.')).toBeTruthy()
    expect(within(forecast).queryAllByRole('listitem')).toHaveLength(0)
  })
})

/** Reads the value shown next to a weather detail label (the <dd> after its <dt>). */
function detailValue(label: string): string | null | undefined {
  const term = screen.getByText(label).closest('dt')
  return term?.nextElementSibling?.textContent
}
