import { NextResponse } from 'next/server';

export default function proxy(request: any) {
    const { pathname } = request.nextUrl;

    
    // Cookie name must match lib/auth.ts exactly
    const sessionCookie = request.cookies.get('admin_auth_session');

    // 1. Bypass all authentication portals and public routes immediately
    if (pathname.includes('login') || 
        pathname.includes('register') || 
        pathname.includes('/api/') || 
        pathname === '/') {
        return NextResponse.next();
    }

    // 2. Simple protection for admin routes
    if (pathname.startsWith('/admin')) {
        if (!sessionCookie) {
            // If they are deep in super-pro territory, send to super-pro login
            if (pathname.startsWith('/admin/super-pro')) {
                return NextResponse.redirect(new URL('/admin/super-pro-login', request.url));
            }
            // Otherwise default login
            return NextResponse.redirect(new URL('/admin/login/akash1801', request.url));
        }
    }

    return NextResponse.next();
}

export const proxyConfig = {
    matcher: ['/admin/:path*'],
};

