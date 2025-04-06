import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Remove verifyToken import if not used here
// import { verifyToken } from '@/app/lib/auth';

export async function middleware(request: NextRequest) {
  // Paths that don't require authentication
  const publicPaths = ['/', '/login', '/register'];

  // API routes should generally be handled by their own auth checks
  const isApiPath = request.nextUrl.pathname.startsWith('/api/');

  const isPublicPath = publicPaths.some(path =>
    request.nextUrl.pathname === path || (path !== '/' && request.nextUrl.pathname.startsWith(path + '/'))
  );

  const token = request.cookies.get('token')?.value;

  // If accessing a protected route without a token, redirect to login
  if (!token && !isPublicPath && !isApiPath) {
    console.log(`Middleware: No token, accessing protected path ${request.nextUrl.pathname}. Redirecting to login.`);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname); // Store redirect info
    return NextResponse.redirect(loginUrl);
  }

  // If accessing login/register page WITH a token, redirect to dashboard
  // We don't need to verify the token here rigorously; if it's present, assume potential validity.
  // The actual session check happens in the layout/pages.
  if (token && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
    console.log(`Middleware: Has token, accessing public auth path ${request.nextUrl.pathname}. Redirecting to dashboard.`);
    const dashboardUrl = new URL('/dashboard', request.url);
    
    // Use 307 to ensure it's a temporary redirect and maintains the HTTP method
    return NextResponse.redirect(dashboardUrl, { status: 307 });
  }

  // Allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Giatmara.png (logo file in public) - Adjust if needed
     * - certificate-example.jpg (example image in public) - Adjust if needed
     * - uploads/ (uploaded files) - IMPORTANT: Exclude uploads if served publicly
     *
     * DO NOT exclude /api/ here, let middleware run but handle API paths internally.
     */
    '/((?!_next/static|_next/image|favicon.ico|Giatmara.png|certificate-example.jpg|uploads/).*)',
  ],
};
