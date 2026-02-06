import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // ✅ Content Security Policy (Next.js + Supabase + CDN safe)
  const csp = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
    img-src * data: blob:;
    font-src 'self' data:;
    connect-src * ws: wss:;
    frame-src https://www.google.com/recaptcha/;
    base-uri 'self';
    form-action 'self';
  `

  response.headers.set(
    'Content-Security-Policy',
    csp.replace(/\n/g, ' ')
  )

  // ✅ Extra basic security headers (safe on Vercel)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

// ❗ IMPORTANT: do NOT run middleware on static files
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
