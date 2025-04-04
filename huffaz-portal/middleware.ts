import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/app/lib/auth';

export async function middleware(request: NextRequest) {
  // Paths that don't require authentication
  const publicPaths = ['/', '/login', '/register'];
  
  // Paths that should bypass MBTI check
  const mbtiExemptPaths = ['/', '/login', '/register', '/mbti-assessment', '/api'];
  
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')
  );
  
  const isMbtiExemptPath = mbtiExemptPaths.some(path => 
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')
  );

  const token = request.cookies.get('token')?.value;

  // Redirect to login if accessing protected route without token
  if (!token && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if accessing public route with valid token
  if (token && isPublicPath && request.nextUrl.pathname !== '/') {
    try {
      const decoded = verifyToken(token);
      if (decoded) {
        // We will check mbtiCompleted status in the dashboard, not here
        const dashboardUrl = new URL('/dashboard', request.url);
        return NextResponse.redirect(dashboardUrl);
      }
    } catch (error) {
      // Token is invalid, continue to public route
    }
  }

  return NextResponse.next();
}

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