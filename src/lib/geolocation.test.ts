import { afterEach, describe, expect, it, vi } from 'vitest'
import { getCurrentCoordinates, LocationError } from './geolocation.ts'

type Success = (position: { coords: { latitude: number; longitude: number } }) => void
type Failure = (error: { code: number; message: string }) => void

/** Replaces navigator.geolocation with a fake that answers the way `respond` says. */
function stubGeolocation(
  respond: (success: Success, failure: Failure, options?: PositionOptions) => void,
) {
  const getCurrentPosition = vi.fn(respond)
  vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
  return getCurrentPosition
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getCurrentCoordinates', () => {
  it('resolves with the position rounded to about 1 km', async () => {
    stubGeolocation((success) => success({ coords: { latitude: 14.554729, longitude: 121.024445 } }))

    expect(await getCurrentCoordinates()).toEqual({ latitude: 14.55, longitude: 121.02 })
  })

  it('reports a denied permission', async () => {
    stubGeolocation((_success, failure) => failure({ code: 1, message: 'User denied Geolocation' }))

    const error = await getCurrentCoordinates().catch((e: unknown) => e)

    expect(error).toBeInstanceOf(LocationError)
    expect(error).toMatchObject({ kind: 'location-denied' })
  })

  it('reports a position the device could not determine', async () => {
    stubGeolocation((_success, failure) => failure({ code: 2, message: 'Position unavailable' }))

    await expect(getCurrentCoordinates()).rejects.toMatchObject({ kind: 'location-unavailable' })
  })

  it('reports a timeout', async () => {
    stubGeolocation((_success, failure) => failure({ code: 3, message: 'Timeout expired' }))

    await expect(getCurrentCoordinates()).rejects.toMatchObject({ kind: 'location-timeout' })
  })

  it('reports when the browser has no geolocation support', async () => {
    vi.stubGlobal('navigator', {})

    await expect(getCurrentCoordinates()).rejects.toMatchObject({ kind: 'location-unsupported' })
  })

  it('asks for a quick, low-accuracy fix with a time limit', async () => {
    const getCurrentPosition = stubGeolocation((success) =>
      success({ coords: { latitude: 1, longitude: 2 } }),
    )

    await getCurrentCoordinates()

    const options = getCurrentPosition.mock.calls[0][2]
    expect(options?.enableHighAccuracy).toBe(false)
    expect(options?.timeout).toBeGreaterThan(0)
  })
})
