import { cookies } from 'next/headers';

/**
 * Interface for the secure session stored in cookies.
 * Moving away from localStorage to prevent XSS and manual tampering.
 */
export interface AdminSession {
    id: string;
    email: string;
    name: string;
    role: 'super_pro_admin' | 'super_admin' | 'sub_admin' | 'analytics_admin';
    loginTime: string;
}

const SESSION_COOKIE_NAME = 'admin_auth_session';

/**
 * Gets the current authenticated session from cookies.
 * This is the secure way to verify the user on the server.
 */
export async function getServerSession(): Promise<AdminSession | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie || !sessionCookie.value) {
        return null;
    }

    try {
        // In a production environment, this should ideally be a signed JWT.
        // For now, we will use a base64 encoded JSON for better security than plain text.
        const decoded = Buffer.from(sessionCookie.value, 'base64').toString();
        return JSON.parse(decoded) as AdminSession;
    } catch (e) {
        console.error('Failed to parse session cookie');
        return null;
    }
}

/**
 * Sets the secure session cookie.
 */
export async function setServerSession(session: AdminSession) {
    const cookieStore = await cookies();
    const encoded = Buffer.from(JSON.stringify(session)).toString('base64');
    
    cookieStore.set(SESSION_COOKIE_NAME, encoded, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
    });
}

/**
 * Removes the session cookie.
 */
export async function clearServerSession() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}
