import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'admin_auth_session';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { passcode } = body;

        if (!passcode) {
            return NextResponse.json({ success: false, error: 'Passcode required' }, { status: 400 });
        }

        // Validate passcode
        const envPasscode = process.env.NEXT_PUBLIC_SUPER_ADMIN_PINCODE;
        const hardcodedPasscode = process.env.SUPER_ADMIN_PINCODE || '180117';
        const validPasscodes = [envPasscode, hardcodedPasscode].filter(Boolean);

        if (!validPasscodes.includes(passcode.trim())) {
            return NextResponse.json({ success: false, error: 'Invalid passcode' }, { status: 401 });
        }

        // Create session payload
        const session = {
            id: 'super-pro-master',
            email: 'superproadmin@thinkaiq.com',
            name: 'Super Pro Admin',
            role: 'super_pro_admin',
            loginTime: new Date().toISOString()
        };

        const encoded = Buffer.from(JSON.stringify(session)).toString('base64');

        // Create response and set cookie directly on the response object
        const response = NextResponse.json({ success: true });

        response.cookies.set(SESSION_COOKIE_NAME, encoded, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        return response;

    } catch (error: any) {
        console.error('Super Pro Auth Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
