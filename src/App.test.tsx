import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'

describe('App', () => {
  it('renders the page landmarks', () => {
    const html = renderToStaticMarkup(<App />)

    expect(html).toContain('<header')
    expect(html).toContain('<main')
    expect(html).toContain('<footer')
  })

  it('has a single top-level heading', () => {
    const html = renderToStaticMarkup(<App />)

    expect(html.match(/<h1/g)).toHaveLength(1)
  })

  it('credits Open-Meteo as the weather data source', () => {
    const html = renderToStaticMarkup(<App />)

    expect(html).toContain('https://open-meteo.com')
  })
})
