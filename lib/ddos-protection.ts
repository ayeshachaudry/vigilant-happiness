/**
 * DDoS Protection Utilities
 * Includes rate limiting, request validation, and attack detection
 */

import { NextRequest, NextResponse } from 'next/server';

// In-memory store for rate limiting per IP (should use Redis in production)
const rateLimitStore = new Map<
    string,
    { count: number; resetTime: number; blockedUntil?: number }
>();

// Track request fingerprints to detect replay attacks
const requestFingerprintStore = new Map<
    string,
    { timestamp: number; hash: string }
>();

/**
 * Extract client IP from request headers (supports proxies)
 */
export function getClientIp(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    const realIp = request.headers.get('x-real-ip');
    if (realIp) return realIp.trim();
    return 'unknown';
}

/**
 * Validate IP format (IPv4 and IPv6)
 */
export function isValidIp(ip: string): boolean {
    if (ip === 'unknown') return false;
    const ipv4 =
        /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) &&
        ip.split('.').every((n) => parseInt(n) <= 255);
    const ipv6 = /^([a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}$/i.test(ip);
    return ipv4 || ipv6;
}

interface RateLimitOptions {
    maxRequests?: number;
    windowMs?: number;
    blockDurationMs?: number;
}

/**
 * Rate limiter with exponential backoff for repeated offenders
 */
export function checkRateLimit(
    ip: string,
    options: RateLimitOptions = {}
): { allowed: boolean; remaining: number; resetTime: number } {
    const maxRequests = options.maxRequests || 100;
    const windowMs = options.windowMs || 60000; // 1 minute default
    const blockDurationMs = options.blockDurationMs || 300000; // 5 mins default

    const now = Date.now();
    const entry = rateLimitStore.get(ip) || {
        count: 0,
        resetTime: now + windowMs,
    };

    // Check if IP is currently blocked
    if (entry.blockedUntil && now < entry.blockedUntil) {
        return { allowed: false, remaining: 0, resetTime: entry.blockedUntil };
    }

    // Reset window if expired
    if (now >= entry.resetTime) {
        entry.count = 0;
        entry.resetTime = now + windowMs;
        entry.blockedUntil = undefined;
    }

    entry.count++;

    // Exponential backoff: block for longer if repeated violations
    const violations = Math.floor(entry.count / maxRequests);
    if (entry.count > maxRequests) {
        entry.blockedUntil =
            now + blockDurationMs * Math.pow(2, Math.min(violations - 1, 3)); // Cap at 2^3 = 8x base
    }

    rateLimitStore.set(ip, entry);

    return {
        allowed: entry.count <= maxRequests,
        remaining: Math.max(0, maxRequests - entry.count),
        resetTime: entry.resetTime,
    };
}

/**
 * Detect and prevent replay attacks by tracking request fingerprints
 */
export function detectReplayAttack(
    ip: string,
    path: string,
    bodyHash?: string
): boolean {
    const fingerprint = `${ip}:${path}:${bodyHash || 'no-body'}`;
    const now = Date.now();
    const replayWindow = 1000; // 1 second window

    const existing = requestFingerprintStore.get(fingerprint);
    if (existing && now - existing.timestamp < replayWindow) {
        return true; // Likely a replay attack
    }

    requestFingerprintStore.set(fingerprint, {
        timestamp: now,
        hash: bodyHash || 'no-body',
    });

    // Clean old entries (older than 5 minutes)
    if (requestFingerprintStore.size > 10000) {
        for (const [key, val] of requestFingerprintStore.entries()) {
            if (now - val.timestamp > 300000) {
                requestFingerprintStore.delete(key);
            }
        }
    }

    return false;
}

/**
 * Validate request headers to detect common attack patterns
 */
export function validateRequestHeaders(request: NextRequest): {
    valid: boolean;
    reason?: string;
} {
    const headers = request.headers;

    // Check for suspicious user agents
    const userAgent = headers.get('user-agent') || '';
    const suspiciousAgents = [
        'curl',
        'wget',
        'python',
        'bot',
        'crawl',
        'scanner',
        'nikto',
        'sqlmap',
        'nmap',
    ];
    if (suspiciousAgents.some((agent) => userAgent.toLowerCase().includes(agent))) {
        // Log but allow (could be legitimate)
        console.warn(`[Security] Suspicious user agent detected: ${userAgent}`);
    }

    // Reject requests with missing/invalid origin on sensitive endpoints
    const path = request.nextUrl.pathname;
    if (path.startsWith('/api/') && path !== '/api/faculty') {
        const origin = headers.get('origin');
        const referer = headers.get('referer');
        if (!origin && !referer) {
            return { valid: false, reason: 'Missing origin/referer on API request' };
        }
    }

    // Check for oversized headers
    let headerSize = 0;
    headers.forEach((value) => {
        headerSize += value.length;
    });
    if (headerSize > 32000) {
        // 32KB limit
        return { valid: false, reason: 'Headers exceed size limit' };
    }

    return { valid: true };
}

/**
 * Sanitize and validate JSON payload
 */
export function validateJsonPayload(
    data: unknown,
    maxSize: number = 10240
): { valid: boolean; reason?: string; data?: unknown } {
    if (!data || typeof data !== 'object') {
        return { valid: false, reason: 'Invalid JSON' };
    }

    const str = JSON.stringify(data);
    if (str.length > maxSize) {
        return { valid: false, reason: `Payload exceeds ${maxSize} bytes` };
    }

    return { valid: true, data };
}

/**
 * Create rate limit response
 */
export function rateLimitResponse(
    remaining: number,
    resetTime: number
): NextResponse {
    return NextResponse.json(
        {
            error: '🛡️ Too many requests. Your IP has been temporarily throttled due to excessive activity. Please try again later.',
        },
        {
            status: 429,
            headers: {
                'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
                'X-RateLimit-Remaining': remaining.toString(),
            },
        }
    );
}

/**
 * Create bad request response for validation failures
 */
export function badRequestResponse(reason: string): NextResponse {
    return NextResponse.json(
        { error: `Invalid request: ${reason}` },
        { status: 400 }
    );
}

/**
 * Log security event (use proper logging in production)
 */
export function logSecurityEvent(
    eventType: string,
    ip: string,
    details: Record<string, unknown>
): void {
    console.warn(`[SECURITY] ${eventType} from ${ip}`, details);
}
