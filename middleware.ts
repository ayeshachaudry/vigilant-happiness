import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateRequestHeaders, getClientIp } from '@/lib/ddos-protection';

export function middleware(request: NextRequest) {
  const ip = getClientIp(request);

  // Validate request headers for basic DDoS/attack detection
  const headerValidation = validateRequestHeaders(request);
  if (!headerValidation.valid) {
    console.warn(`[Security] Invalid request from ${ip}: ${headerValidation.reason}`);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }

  const response = NextResponse.next();

  // CSP - Balance security with functionality
  // External scripts (https) are allowed; inline execution needs care
  const csp =
    process.env.NODE_ENV === 'production'
      ? `default-src 'self'; script-src 'self' https:; style-src 'self' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https:; frame-src https://www.google.com/recaptcha/; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;`
      : `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' ws: https:; frame-src https://www.google.com/recaptcha/; frame-ancestors 'none'; base-uri 'self'; form-action 'self';`;
  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
