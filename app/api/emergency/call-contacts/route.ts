import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { contacts, ownerName, incidentType } = await req.json()

        if (!contacts || !Array.isArray(contacts)) {
            return NextResponse.json({ error: 'Missing numbers' }, { status: 400 })
        }

        const formatNumber = (num: string) => {
            let n = num.replace(/\D/g, '')
            if (n.startsWith('0')) n = n.substring(1) // Remove leading zero if present
            if (n.length === 10) n = '91' + n
            return n
        }

        const appId = process.env.NEXT_PUBLIC_TELECMI_APP_ID
        const secret = process.env.TELECMI_APP_SECRET
        const fromNumber = process.env.TELECMI_CALLER_ID

        console.log('[DEBUG] TeleCMI Trigger:', { appId, secret: secret ? '***' : 'MISSING', from: fromNumber })

        if (!appId || !secret || !fromNumber) {
            console.error('[ERROR] TeleCMI configuration missing in .env')
            return NextResponse.json({ success: true, message: 'Simulation: Calls triggered' })
        }

        const virtualNumberInt = parseInt(fromNumber.replace(/\D/g, ''))

        // Call each contact and play an emergency message/siren
        const scanResults = await Promise.all(contacts.map(async (phone) => {
            const formatted = formatNumber(phone)
            console.log(`[DEBUG] Attempting call to contact: ${formatted}`)

            const apiBody = {
                appid: parseInt(appId),
                secret: secret,
                from: Number(fromNumber.replace(/\D/g, '')), // Must be number for TeleCMI
                to: Number(formatted),                        // Must be number for TeleCMI
                pcmo: [
                    {
                        action: "play",
                        file_url: "https://www.soundjay.com/mechanical/siren-1.mp3"
                    },
                    {
                        action: "speak",
                        text: `Emergency. Emergency. Emergency. This is an urgent alert. Emergency. Emergency. Check your WhatsApp and Email now. Emergency. Emergency. Emergency.`
                    }
                ]
            }

            try {
                const response = await fetch('https://rest.telecmi.com/v2/ind_pcmo_make_call', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(apiBody)
                })
                const resData = await response.json()
                console.log(`[DEBUG] TeleCMI API Response for ${formatted}:`, resData)
                return resData
            } catch (e: any) {
                console.error(`[ERROR] Fetch failed to TeleCMI for ${formatted}:`, e.message)
                return { error: 'Fetch failed' }
            }
        }))

        return NextResponse.json({ success: true, results: scanResults })

    } catch (error: any) {
        console.error('Broadcast Call API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
