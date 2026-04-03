export const LOCATION_IQ_KEY = 'pk.929d1fd441ba50d2f03ec8dbcb8be0d4';

export async function getAddressFromCoords(lat: number, lon: number) {
    try {
        const url = `https://us1.locationiq.com/v1/reverse.php?key=${LOCATION_IQ_KEY}&lat=${lat}&lon=${lon}&format=json`;
        const response = await fetch(url);
        const data = await response.json();
        return data.display_name || 'Address unavailable';
    } catch (error) {
        console.error('Reverse Geocoding Error:', error);
        return 'Address unavailable';
    }
}

export function createGoogleMapsLink(lat: number, lon: number) {
    return `https://www.google.com/maps?q=${lat},${lon}`;
}
