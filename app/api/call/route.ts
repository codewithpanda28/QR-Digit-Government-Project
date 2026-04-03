import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { scannerNumber, ownerNumber } = await req.json()

        if (!scannerNumber || !ownerNumber) {
            return NextResponse.json({ error: 'Missing numbers' }, { status: 400 })
        }

        // Format numbers to Indian format (91 prefix)
        const formatNumber = (num: string) => {
            let n = num.replace(/\D/g, '')
            if (n.length === 10) n = '91' + n
            return n
        }

        const scannerFormatted = formatNumber(scannerNumber)
        const ownerFormatted = formatNumber(ownerNumber)

        const appId = process.env.NEXT_PUBLIC_TELECMI_APP_ID
        const secret = process.env.TELECMI_APP_SECRET
        const fromNumber = process.env.TELECMI_CALLER_ID

        if (!appId || !secret || !fromNumber) {
            return NextResponse.json({ error: 'TeleCMI configuration missing' }, { status: 500 })
        }

        // Bridge Call Logic:
        // 1. Call Scanner (to)
        // 2. Once Scanner answers, bridge to Owner (connect)
        const virtualNumberInt = parseInt(fromNumber.replace(/\D/g, ''))

        const apiBody = {
            appid: parseInt(appId),
            secret: secret,
            from: virtualNumberInt, // Leg 1: Virtual Number calls Scanner
            to: parseInt(scannerFormatted), // Leg 1 target: The Person Scanning
            pcmo: [
                {
                    action: "bridge",
                    duration: 300,
                    timeout: 25,
                    // Leg 2: Virtual Number calls Owner
                    // NOTE: We MUST use our virtual number here too. 
                    // Most providers don't allow spoofing external numbers.
                    from: virtualNumberInt,
                    connect: [
                        {
                            type: "pstn",
                            number: parseInt(ownerFormatted)
                        }
                    ]
                }
            ]
        }

        console.log('Initiating TeleCMI Bridge Call:', {
            appId: appId,
            from: virtualNumberInt,
            to: scannerFormatted,
            owner: ownerFormatted
        })

        const response = await fetch('https://rest.telecmi.com/v2/ind_pcmo_make_call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apiBody)
        })

        const data = await response.json()
        console.log('TeleCMI API Response:', data)

        if (data.code === 200 || data.status === 'progress' || data.status === 'success') {
            return NextResponse.json({ success: true, requestId: data.request_id || data.data?.request_id })
        } else {
            return NextResponse.json({
                error: data.message || data.error || 'TeleCMI Error',
                code: data.code,
                details: data
            }, { status: 400 })
        }

    } catch (error: any) {
        console.error('Call Masking API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
