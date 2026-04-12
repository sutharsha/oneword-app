import maxmind, { CityResponse, Reader } from 'maxmind'
import { open as geolite2Open, GeoIpDbName } from 'geolite2-redist'

let reader: Reader<CityResponse> | null = null
let readerPromise: Promise<Reader<CityResponse>> | null = null

async function getReader(): Promise<Reader<CityResponse>> {
  if (reader) return reader
  if (readerPromise) return readerPromise

  readerPromise = geolite2Open<Reader<CityResponse>>(GeoIpDbName.City, (path: string) =>
    maxmind.open<CityResponse>(path)
  ).then(wrapped => {
    // geolite2-redist returns a WrappedReader; the underlying reader is the maxmind instance
    // The WrappedReader proxies method calls to the underlying reader
    return wrapped as unknown as Reader<CityResponse>
  })

  reader = await readerPromise
  return reader
}

export interface GeoLocation {
  latitude: number
  longitude: number
  city: string | null
  country_code: string | null
}

/**
 * Resolve an IP address to approximate city-level coordinates.
 * Returns null if the IP can't be geolocated.
 * Coordinates are rounded to 2 decimal places (~1km precision).
 */
export async function resolveIP(ip: string): Promise<GeoLocation | null> {
  try {
    // Skip private/local IPs
    if (
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip.startsWith('10.') ||
      ip.startsWith('192.168.') ||
      ip.startsWith('172.16.') ||
      ip.startsWith('172.17.') ||
      ip.startsWith('172.18.') ||
      ip.startsWith('172.19.') ||
      ip.startsWith('172.2') ||
      ip.startsWith('172.3') ||
      ip.startsWith('100.') // Tailscale
    ) {
      return null
    }

    const db = await getReader()
    const result = db.get(ip)

    if (!result?.location?.latitude || !result?.location?.longitude) {
      return null
    }

    return {
      // Round to 2 decimal places (~1km, well within city-level)
      latitude: Math.round(result.location.latitude * 100) / 100,
      longitude: Math.round(result.location.longitude * 100) / 100,
      city: result.city?.names?.en || null,
      country_code: result.country?.iso_code || null,
    }
  } catch (error) {
    console.error('GeoIP lookup failed:', error)
    return null
  }
}

/**
 * Extract the client IP from request headers.
 * Prefers x-forwarded-for (first entry), falls back to x-real-ip.
 */
export function extractIP(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for can be "client, proxy1, proxy2" — take the first
    const first = forwarded.split(',')[0].trim()
    if (first) return first
  }

  const realIP = headers.get('x-real-ip')
  if (realIP) return realIP.trim()

  return null
}
