import QRCode from 'qrcode'
import { supabase, QRCategory } from './supabase'

/**
 * Generate QR code data URL
 */
export async function generateQRCodeDataURL(url: string): Promise<string> {
    try {
        const dataUrl = await QRCode.toDataURL(url, {
            width: 500,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        })
        return dataUrl
    } catch (error) {
        console.error('Error generating QR code:', error)
        throw error
    }
}

/**
 * Get next sequence number for a category
 */
export async function getNextSequenceNumber(category: QRCategory): Promise<number> {
    const { data, error } = await supabase
        .from('category_counters')
        .select('current_count')
        .eq('category', category)
        .single()

    if (error) throw error

    const nextNumber = (data?.current_count || 0) + 1

    // Update counter
    await supabase
        .from('category_counters')
        .update({ current_count: nextNumber })
        .eq('category', category)

    return nextNumber
}

/**
 * Generate multiple QR codes for a category
 */
export async function bulkGenerateQRCodes(
    category: QRCategory,
    quantity: number,
    generatedBy: string,
    subscriptionPeriod: string
): Promise<string[]> {
    const qrCodes: string[] = []
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thinkaiq.com'

    for (let i = 0; i < quantity; i++) {
        const sequenceNumber = await getNextSequenceNumber(category)
        const paddedNumber = sequenceNumber.toString().padStart(2, '0')
        const qrNumber = `${category}/${paddedNumber}`
        const fullUrl = `${baseUrl.replace(/\/$/, '')}/scan/${qrNumber}` // Note: This utility seems to use qrNumber instead of ID which might be a legacy pattern

        const { data, error } = await supabase
            .from('qr_codes')
            .insert({
                qr_number: qrNumber,
                category,
                sequence_number: sequenceNumber,
                full_url: fullUrl,
                status: 'generated',
                generated_by: generatedBy,
                subscription_period: subscriptionPeriod,
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating QR code:', error)
            continue
        }

        qrCodes.push(data.id)
    }

    return qrCodes
}

/**
 * Format category name for display
 */
export function formatCategoryName(category: QRCategory): string {
    const names: Record<QRCategory, string> = {
        'child-safety': 'Child Safety (Mela/Fair Bracelet)',
        'women-safety': 'Women Safety',
        'elderly-safety': 'Elderly Safety',
        'school-safety': 'School Safety',
        'vehicle-safety': 'Vehicle Safety',
        'tourist-safety': 'Tourist Safety',
        'temple-event': 'Temple/Event Safety',
    }
    return names[category]
}

/**
 * Get category color for UI
 */
export function getCategoryColor(category: QRCategory): string {
    const colors: Record<QRCategory, string> = {
        'child-safety': '#FF6B9D',
        'women-safety': '#9D4EDD',
        'elderly-safety': '#4CC9F0',
        'school-safety': '#F72585',
        'vehicle-safety': '#4361EE',
        'tourist-safety': '#06D6A0',
        'temple-event': '#FFB703',
    }
    return colors[category]
}

/**
 * Calculate subscription end date
 */
export function calculateSubscriptionEndDate(
    startDate: Date,
    period: string
): Date {
    const endDate = new Date(startDate)

    switch (period) {
        case '1_month':
            endDate.setMonth(endDate.getMonth() + 1)
            break
        case '3_months':
            endDate.setMonth(endDate.getMonth() + 3)
            break
        case '6_months':
            endDate.setMonth(endDate.getMonth() + 6)
            break
        case '1_year':
            endDate.setFullYear(endDate.getFullYear() + 1)
            break
        case '2_years':
            endDate.setFullYear(endDate.getFullYear() + 2)
            break
        default:
            endDate.setFullYear(endDate.getFullYear() + 1)
    }

    return endDate
}

/**
 * Check if QR code is expired
 */
export function isQRExpired(subscriptionEnd?: string): boolean {
    if (!subscriptionEnd) return false
    return new Date(subscriptionEnd) < new Date()
}

/**
 * Get subscription period label
 */
export function getSubscriptionPeriodLabel(period: string): string {
    const labels: Record<string, string> = {
        '1_month': '1 Month',
        '3_months': '3 Months',
        '6_months': '6 Months',
        '1_year': '1 Year',
        '2_years': '2 Years',
    }
    return labels[period] || period
}
