import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateRequestHeaders, getClientIp } from '@/lib/ddos-protection';

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

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
  const nonce = generateNonce();
  response.headers.set('X-Nonce', nonce);

  // CSP with nonce for inline + https CDNs for external scripts
  // Nonce: for inline <script> tags in HTML
  // https:// external: for trusted CDN scripts (jsdelivr, google reCAPTCHA, etc)
  const csp =
    process.env.NODE_ENV === 'production'
      ? `default-src 'self'; script-src 'self' 'nonce-${nonce}' https:; style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com https://cdn.jsdelivr.net; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https:; frame-src https://www.google.com/recaptcha/; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;`
      : `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'unsafe-eval' https:; style-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' ws: https:; frame-src https://www.google.com/recaptcha/; frame-ancestors 'none'; base-uri 'self'; form-action 'self';`;
  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
