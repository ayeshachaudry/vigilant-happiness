// Simple in-memory rate limiter
// ⚠️ WARNING: For production, use Redis or a persistent store
// This implementation is vulnerable to distributed attacks
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const MAX_STORED_RECORDS = 10000; // Prevent unbounded memory growth

export function rateLimit(identifier: string, limit: number = 100, windowMs: number = 60000): boolean {
    // Prevent memory exhaustion
    if (requestCounts.size > MAX_STORED_RECORDS) {
        requestCounts.clear();
    }

    const now = Date.now();
    const record = requestCounts.get(identifier);

    if (!record || now > record.resetTime) {
        requestCounts.set(identifier, {
            count: 1,
            resetTime: now + windowMs,
        });
        return true;
    }

    if (record.count < limit) {
        record.count++;
        return true;
    }

    return false;
}

// Cleanup old records to prevent memory leak
setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, record] of requestCounts.entries()) {
        if (now > record.resetTime) {
            requestCounts.delete(key);
            cleaned++;
        }
    }
    if (cleaned > 0) {
        console.log(`[RateLimit] Cleaned up ${cleaned} expired records`);
    }
}, 300000); // Cleanup every 5 minutes
