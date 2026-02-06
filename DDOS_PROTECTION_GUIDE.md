# DDoS Protection & Security Hardening Guide

## Summary of Protections Applied

This document outlines all DDoS and security mitigations implemented in the faculty review application.

---

## 1. Rate Limiting (Per-IP)

### Implementation
- **File**: `lib/ddos-protection.ts`
- **Strategy**: In-memory rate limiting with exponential backoff for repeat offenders

### Endpoints Configuration
- **`GET /api/faculty`**: 200 requests/min per IP → 5 min block on violation
- **`POST /api/reviews`**: 10 requests/hour per IP → 15 min exponential backoff per violation
- **`GET /api/reviews`**: 100 requests/hour per IP → 10 min block on violation

### Escalation Mechanism
- Repeated violations within the same window trigger exponential backoff (2x, 4x, 8x base block duration)
- Example: 2nd violation = 10 min block, 3rd = 20 min, 4th = 40 min, capped at 40 min max

---

## 2. Request Header Validation

### Checks Applied
✅ **Suspicious User-Agent Detection**
- Blocks/logs: curl, wget, python, bot, scanner, nikto, sqlmap, nmap
- Logged but allowed (may be legitimate)

✅ **Missing Origin/Referer on API Requests**
- Enforced for sensitive endpoints (`/api/reviews`, `/api/faculty`)
- Development requests (`localhost`) bypass this

✅ **Header Size Validation**
- Maximum 32 KB per request (protects against header injection attacks)

---

## 3. Replay Attack Detection

### Mechanism
- Fingerprinting: `IP + Path + BodyHash` (SHA-256)
- Window: 1 second (detects duplicate submissions)
- Cleanup: Automatic removal of entries older than 5 minutes
- Limit: 10,000 stored fingerprints before cleanup triggered

### Use Case
- Prevents rapid duplicate reviews from same IP
- Detects automated submission tools

---

## 4. Payload Validation & Size Limits

### Request Body Size Limits
- **API Reviews**: 5 KB max
- **API Faculty**: 10 KB max (default)
- **Global Next.js**: 10 MB max (server config)

### Content Validation
- JSON structure validation
- Review input validation (banned words, rating 1-5, comment length)
- Faculty ID validation (numeric, reasonable bounds)
- Search query validation (alphanumeric + symbols, max length)

---

## 5. Security Headers (Middleware)

### Core Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()
```

### Origin Isolation
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: same-origin
```

### HSTS & HTTPS Enforcement
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### Content Security Policy (CSP)

**Development (Permissive)**:
```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net
style-src 'self' 'unsafe-inline'
img-src 'self' data: https:
font-src 'self' data: https:
connect-src 'self' ws://localhost:* https://*.supabase.co https://cdn.jsdelivr.net
frame-ancestors 'none'
base-uri 'self'
form-action 'self'
```

**Production (Strict)**:
```
default-src 'self'
script-src 'self' https://cdn.jsdelivr.net
style-src 'self' 'nonce-{random}'
img-src 'self' data: https:
font-src 'self' data: https:
connect-src 'self' https://*.supabase.co
frame-ancestors 'none'
base-uri 'self'
form-action 'self'
upgrade-insecure-requests
```

---

## 6. CORS Hardening

### Strict Origin Policy
- **Allowed Origins**: 
  - `NEXT_PUBLIC_SITE_URL` (from environment)
  - `http://localhost:3000` (dev only)
- **Allowed Methods**: GET, POST, OPTIONS
- **Allowed Headers**: Content-Type only
- **Max Age**: 3600 seconds (1 hour)

### Supabase CORS
- Configure in Dashboard → Settings → CORS
- Add your production domain(s)
- Remove wildcard (*) if present

---

## 7. Input Sanitization

### Search Query Validation
```typescript
// Max 100 chars, alphanumeric + common symbols
/^[a-zA-Z0-9\s\-.,;:']+$/
```

### Review Comments
```typescript
// Max 5000 chars, detect banned words
// Prohibited: hate speech, profanity, spam keywords
```

### Faculty ID
```typescript
// Numeric validation, positive integer
// Range: 1 to 2147483647 (32-bit signed int)
```

---

## 8. Row-Level Security (RLS) in Supabase

### Faculty Table
- **SELECT**: Allowed for all (public read)
- **INSERT/UPDATE/DELETE**: Blocked for anon role (use service role only)

### Reviews Table
- **SELECT**: Allowed for all (view reviews)
- **INSERT**: Allowed with validation constraints
  - Rating: 1-5
  - Comment: ≤ 5000 chars
- **UPDATE/DELETE**: Blocked for anon role

**Setup**: Run SQL in `SUPABASE_RLS_SECURITY.sql`

---

## 9. Compression & Performance Optimization

### Enabled Features
✅ Gzip/Brotli compression (responses)
✅ Image optimization & webp format
✅ SWC minification (faster build)
✅ Tree-shaking of unused code
✅ Package import optimization

### Benefits
- Reduced bandwidth (helps mitigate DDoS impact)
- Faster response times
- Lower server load

---

## 10. API Response Caching

### Cache Control Headers
- **Static Content**: `public, max-age=300, s-maxage=3600` (5 min client / 1 hour CDN)
- **API Responses**: `no-store, no-cache, must-revalidate` (no caching for data)

### Vercel Edge Caching
- Automatically caches responses at edge servers
- Reduces load on origin server during traffic spikes

---

## 11. Monitoring & Logging

### Security Events Logged
- Rate limit violations
- Replay attacks detected
- Invalid headers
- Suspicious user agents
- Database errors
- RLS violations

### Log Format
```typescript
[SECURITY] {EventType} from {IP} {Details}
```

### Review Logs
- Vercel Analytics & Logs: `vercel.com/dashboard`
- Supabase Logs: Dashboard → Logs
- Set up alerts for unusual patterns (contact your host)

---

## 12. Secret Management

### Hardcoded Secrets Removed
✅ Supabase credentials removed from:
- `scripts/upload_faculty_data.py`
- `scripts/setup_schema.py`
- `scripts/load_all_instructors.py`

### Environment Variables Required
```bash
# Local .env.local (never commit)
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Python scripts
export SUPABASE_URL=https://...supabase.co
export SUPABASE_KEY=...
```

### Vercel Deployment
- Set via Project Settings → Environment Variables
- Automatically available as `process.env.*`

---

## 13. Infrastructure-Level DDoS Protection

### Vercel (Automatic)
- **DDoS Mitigation**: Vercel's Edge Network blocks large-scale attacks
- **Rate Limiting**: Automatic throttling of suspicious traffic
- **Bot Protection**: Integrated bot detection (upgradeable to advanced)

### Enable Advanced Protection
1. Go to `vercel.com/dashboard` → Project Settings
2. Navigate to Integrations or Security section
3. Enable "Advanced DDoS Protection" or "Web Application Firewall" (if available)

---

## 14. SQL Injection & NoSQL Injection Prevention

### Parameterized Queries
- All database queries use Supabase PostgREST (parameterized by default)
- No string concatenation in SQL/queries
- Input validation before query execution

### Example (Safe)
```typescript
const { data } = await supabase
  .from('faculty')
  .select('*')
  .eq('university', university); // Parameter, not concatenated
```

---

## 15. Secrets Rotation Instructions

### If Keys Were Exposed
**URGENT**: Rotate keys immediately.

1. **Supabase Dashboard**
   - Settings → API → Service Role / Anon Key
   - Click "Rotate" button
   - Confirm

2. **Update Environment**
   ```bash
   # Remove old .env.local (already in .gitignore)
   # Update Vercel environment variables
   ```

3. **Redeploy**
   ```bash
   git add . && git commit -m "Update Supabase keys"
   git push
   # Vercel auto-deploys with new keys
   ```

---

## 16. Checklist for Production Deployment

- [ ] Rotate Supabase keys
- [ ] Configure CORS in Supabase Dashboard
- [ ] Set `NEXT_PUBLIC_SITE_URL` environment variable to your domain
- [ ] Enable RLS policies via SQL (run `SUPABASE_RLS_SECURITY.sql`)
- [ ] Enable Vercel Advanced DDoS Protection
- [ ] Enable HSTS preload (via `https://hstspreload.org/`)
- [ ] Set up monitoring alerts
- [ ] Enable Supabase automated backups
- [ ] Test with load testing tool (e.g., `ab`, `wrk`, or `hey`)
- [ ] Review CSP in production (update inline scripts if needed)

---

## 17. Testing & Validation

### Local Load Testing
```bash
# Using 'hey' (Apache Bench alternative)
hey -n 1000 -c 100 http://localhost:3000/api/faculty

# Expected: Rate limit kicks in around 200 requests
```

### Verify Rate Limiting
```bash
# Rapid requests should get 429 after limit
for i in {1..30}; do curl -i http://localhost:3000/api/faculty; done
```

### Check Security Headers
```bash
curl -i http://yourdomain.com | grep -E "X-|Strict-Transport|CSP|CORS"
```

---

## 18. Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/api#security)
- [NIST DDoS Mitigation](https://csrc.nist.gov/publications/detail/sp/800-61/rev-1/final)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Vercel Security](https://vercel.com/security)

---

## Contact & Support

For security issues or questions:
1. **Vercel Support**: https://vercel.com/support
2. **Supabase Community**: https://discord.supabase.io
3. **Security Vulnerabilities**: Do not post publicly; contact the respective platform's security team.

---

**Last Updated**: February 7, 2026
