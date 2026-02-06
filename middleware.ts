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

  // CSP with nonce - runtime generation per request
  const csp =
    process.env.NODE_ENV === 'production'
      ? `default-src 'self'; script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; style-src 'self' 'nonce-${nonce}'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://www.google.com/recaptcha/; frame-src https://www.google.com/recaptcha/; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;`
      : `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'unsafe-eval' https://cdn.jsdelivr.net https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; style-src 'self' 'nonce-${nonce}'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' ws://localhost:* https://*.supabase.co https://cdn.jsdelivr.net https://www.google.com/recaptcha/; frame-src https://www.google.com/recaptcha/; frame-ancestors 'none'; base-uri 'self'; form-action 'self';`;
  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
