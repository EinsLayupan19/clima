// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
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

    const link = screen.getByRole('link', { name: 'Open-Meteo' })
    expect(link.getAttribute('href')).toBe('https://open-meteo.com')
  })
})

describe('City search', () => {
  it('searches when Enter is pressed and shows the location', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          results: [geocodingResult('Manila', 'National Capital Region', 'Philippines')],
        }),
      ),
    )
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('City'), 'Manila{Enter}')

    expect(await screen.findByRole('heading', { level: 1, name: 'Manila' })).toBeTruthy()
    expect(screen.getByText('National Capital Region, Philippines')).toBeTruthy()
  })

  it('searches when the Search button is clicked', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ results: [geocodingResult('New York', 'New York', 'United States')] }),
      ),
    )
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('City'), 'New York')
    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'New York' })).toBeTruthy()
  })

  it('announces that it is searching while the request is in flight', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})))
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('City'), 'Manila{Enter}')

    expect(screen.getByRole('status').textContent).toBe('Searching for Manila…')
  })

  it('asks for a city name instead of searching when the input is blank', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('City'), '   ')
    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(screen.getByText('Enter a city name to search.')).toBeTruthy()
    expect(screen.getByLabelText('City').getAttribute('aria-invalid')).toBe('true')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('clears the blank-input message once the user starts typing', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Search' }))
    await user.type(screen.getByLabelText('City'), 'L')

    expect(screen.queryByText('Enter a city name to search.')).toBeNull()
  })

  it('tells the user when no city matches', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ generationtime_ms: 0.1 })))
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('City'), 'Zzqxqx{Enter}')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'No results for “Zzqxqx”' }),
    ).toBeTruthy()
  })

  it('shows a connection error and recovers when Try again is pressed', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce(
          jsonResponse({ results: [geocodingResult('Lima', 'Lima region', 'Peru')] }),
        ),
    )
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('City'), 'Lima{Enter}')
    expect(await screen.findByRole('heading', { level: 1, name: 'Couldn’t connect' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Lima' })).toBeTruthy()
  })

  it('shows only the latest result when searches overlap', async () => {
    let resolveSlowSearch: (response: Response) => void = () => {}
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockReturnValueOnce(new Promise<Response>((resolve) => (resolveSlowSearch = resolve)))
        .mockResolvedValueOnce(
          jsonResponse({ results: [geocodingResult('Oslo', 'Oslo', 'Norway')] }),
        ),
    )
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
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ results: [geocodingResult('Tokyo', 'Tokyo', 'Japan')] })),
    )
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Tokyo' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Tokyo' })).toBeTruthy()
    expect((screen.getByLabelText('City') as HTMLInputElement).value).toBe('Tokyo')
  })
})
