/**
 * Get current location using browser Geolocation API with robust fallback
 */
export async function getCurrentLocation(): Promise<{
    lat: number
    lng: number
    accuracy: number
} | null> {
    const getPos = (config: PositionOptions): Promise<GeolocationPosition | null> => {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve(pos),
                (err) => {
                    console.warn(`GPS Attempt Error (${err.code}): ${err.message}`);
                    resolve(null);
                },
                config
            )
        })
    }

    if (typeof window === 'undefined' || !navigator.geolocation) {
        console.error('Geolocation is not supported or window is undefined')
        return null
    }

    // Attempt 1: High Accuracy
    console.log('🛰️ Attempting High Accuracy Location...')
    let position = await getPos({
        enableHighAccuracy: true,
        timeout: 10000, // Increased timeout
        maximumAge: 0
    })

    if (position) {
        return {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
        }
    }

    console.error('❌ All Geolocation attempts failed.')
    return null
}

/**
 * Get address from coordinates using reverse geocoding
 */
export async function getAddressFromCoordinates(
    latitude: number,
    longitude: number
): Promise<string> {
    try {
        // Use a timeout for the fetch request
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'SafetyQR-App/1.0'
                }
            }
        )

        clearTimeout(timeoutId)

        if (!response.ok) throw new Error('Network response was not ok')
        const data = await response.json()
        return data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
    } catch (error) {
        console.warn('Reverse geocoding failed, falling back to coordinates:', error)
        return `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
    }
}

/**
 * Create Google Maps link from coordinates
 */
export function createGoogleMapsLink(
    latitude: number,
    longitude: number
): string {
    return `https://www.google.com/maps?q=${latitude},${longitude}`
}

/**
 * Calculate distance between two coordinates (in km)
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371 // Earth's radius in km
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const d = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * d
}

function toRad(degrees: number): number {
    return degrees * (Math.PI / 180)
}

/**
 * Get client IP address
 */
export async function getClientIP(): Promise<string> {
    try {
        const response = await fetch('https://api.ipify.org?format=json')
        const data = await response.json()
        return data.ip
    } catch (error) {
        return 'unknown'
    }
}
