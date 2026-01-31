import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/register', '/forget-password'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get the token from cookies
    const token = request.cookies.get('pos_token')?.value;

    // Check if the current route is a public route
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    // 1. If the user is authenticated and tries to access a public route,
    // redirect them to the dashboard.
    if (token && isPublicRoute) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 2. If the user is NOT authenticated and tries to access a protected route,
    // redirect them to the login page.
    // We ignore static files and api routes
    const isProtectedRoute = !isPublicRoute &&
        !pathname.startsWith('/_next') &&
        !pathname.startsWith('/api') &&
        pathname !== '/' && // Allow root path for now, or change if needed
        !pathname.includes('.'); // Ignore files (images, etc)

    if (!token && isProtectedRoute) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
