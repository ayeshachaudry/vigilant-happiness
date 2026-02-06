import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateRequestHeaders, getClientIp } from '@/lib/ddos-protection';

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const ip = getClientIp(request);
  const nonce = generateNonce();

  // Pass nonce to application via header
  response.headers.set('X-Nonce', nonce);

  // Validate request headers for basic DDoS/attack detection
  const headerValidation = validateRequestHeaders(request);
  if (!headerValidation.valid) {
    console.warn(`[Security] Invalid request from ${ip}: ${headerValidation.reason}`);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }

  // CORS Headers - Strict origin-only policy
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    'http://localhost:3000',
  ];

  if (origin && allowedOrigins.some(allowed => origin === allowed)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    response.headers.set('Access-Control-Max-Age', '3600');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Security Headers - Strict Policy
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

  // Content Security Policy - Use nonce for inline scripts/styles instead of unsafe-inline
  const csp =
    process.env.NODE_ENV === 'production'
      ? `default-src 'self'; script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; style-src 'self' 'nonce-${nonce}'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://www.google.com/recaptcha/; frame-src https://www.google.com/recaptcha/; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;`
      : `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'unsafe-eval' https://cdn.jsdelivr.net https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; style-src 'self' 'nonce-${nonce}'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' ws://localhost:* https://*.supabase.co https://cdn.jsdelivr.net https://www.google.com/recaptcha/; frame-src https://www.google.com/recaptcha/; frame-ancestors 'none'; base-uri 'self'; form-action 'self';`;
  response.headers.set('Content-Security-Policy', csp);

  // Strict Transport Security (1 year, subdomains, preload)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // Disable caching for sensitive content
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
