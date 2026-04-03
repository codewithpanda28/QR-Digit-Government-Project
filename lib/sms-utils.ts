/**
 * Send emergency SMS to contacts
 */
export async function sendEmergencySMS(
    contacts: string[],
    personName: string,
    location: { lat: number; lng: number },
    locationAddress: string,
    evidenceLink?: string
): Promise<{ success: boolean; message: string }> {
    try {
        const googleMapsLink = `https://www.google.com/maps?q=${location.lat},${location.lng}`
        const timestamp = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
        })

        const message = `🚨 EMERGENCY ALERT! 🚨\n\n${personName} needs immediate help!\n\nLocation: ${locationAddress}\n\nGoogle Maps: ${googleMapsLink}${evidenceLink ? `\n\nVisual Evidence: ${evidenceLink}` : ''}\n\nTime: ${timestamp}\n\nPlease reach immediately or call local emergency services.\n\n- QRdigit Safety Alert`

        // Call SMS API
        const response = await fetch('/api/sms/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contacts,
                message,
            }),
        })

        const data = await response.json()

        if (response.ok) {
            return { success: true, message: 'Emergency alerts sent successfully' }
        } else {
            return { success: false, message: data.error || 'Failed to send alerts' }
        }
    } catch (error) {
        console.error('Error sending emergency SMS:', error)
        return { success: false, message: 'Failed to send emergency alerts' }
    }
}

/**
 * Send OTP for verification
 */
export async function sendOTP(
    phone: string,
    purpose: string = 'verification'
): Promise<{ success: boolean; message: string }> {
    try {
        const response = await fetch('/api/otp/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone,
                purpose,
            }),
        })

        const data = await response.json()

        if (response.ok) {
            return { success: true, message: 'OTP sent successfully' }
        } else {
            return { success: false, message: data.error || 'Failed to send OTP' }
        }
    } catch (error) {
        console.error('Error sending OTP:', error)
        return { success: false, message: 'Failed to send OTP' }
    }
}

/**
 * Verify OTP
 */
export async function verifyOTP(
    phone: string,
    otp: string,
    qrId?: string
): Promise<{ success: boolean; message: string }> {
    try {
        const response = await fetch('/api/otp/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone,
                otp,
                qr_id: qrId,
            }),
        })

        const data = await response.json()

        if (response.ok) {
            return { success: true, message: 'OTP verified successfully' }
        } else {
            return { success: false, message: data.error || 'Invalid OTP' }
        }
    } catch (error) {
        console.error('Error verifying OTP:', error)
        return { success: false, message: 'Failed to verify OTP' }
    }
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '')

    // Format as +91-XXXXX-XXXXX for Indian numbers
    if (cleaned.length === 10) {
        return `+91-${cleaned.slice(0, 5)}-${cleaned.slice(5)}`
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
        return `+${cleaned.slice(0, 2)}-${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    }

    return phone
}

/**
 * Mask phone number for privacy
 */
export function maskPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length >= 10) {
        return `${cleaned.slice(0, 2)}XXXXXX${cleaned.slice(-2)}`
    }
    return phone
}

/**
 * Create WhatsApp link
 */
export function createWhatsAppLink(phone: string, message?: string): string {
    const cleaned = phone.replace(/\D/g, '')
    const formattedPhone = cleaned.startsWith('91') ? cleaned : `91${cleaned}`
    const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : ''
    return `https://wa.me/${formattedPhone}${encodedMessage}`
}

/**
 * Create phone call link
 */
export function createPhoneCallLink(phone: string): string {
    return `tel:${phone}`
}
