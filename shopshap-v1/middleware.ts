import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // ✅ Laisser passer les routes système sans vérification
  const systemRoutes = [
    '/api', '/admin', '/dashboard', '/login', '/register', 
    '/profile', '/products', '/orders', '/onboarding', 
    '/_next', '/favicon.ico', '/robots.txt', '/sitemap.xml'
  ];
  
  const isSystemRoute = systemRoutes.some(route => pathname.startsWith(route));
  
  if (isSystemRoute) {
    return NextResponse.next();
  }
  
  // Pour toutes les autres routes, Next.js essaiera [slug]/page.tsx
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