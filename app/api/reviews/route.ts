import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
    getClientIp,
    checkRateLimit,
    detectReplayAttack,
    validateJsonPayload,
    rateLimitResponse,
    badRequestResponse,
    logSecurityEvent,
    isValidIp,
} from '@/lib/ddos-protection';
import { validateReviewInput, validateFacultyId } from '@/lib/validation';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const ip = getClientIp(request);

        // Validate IP format
        if (!isValidIp(ip)) {
            logSecurityEvent('Invalid IP detected', ip, { endpoint: '/api/reviews', method: 'POST' });
            return badRequestResponse('Invalid request');
        }

        // Stricter rate limiting for write operations (10 requests per hour per IP)
        const rateCheck = checkRateLimit(ip, {
            maxRequests: 10,
            windowMs: 3600000, // 1 hour
            blockDurationMs: 900000, // 15 minute block
        });

        if (!rateCheck.allowed) {
            logSecurityEvent('Rate limit exceeded on POST /api/reviews', ip, {
                remaining: rateCheck.remaining,
            });
            return rateLimitResponse(rateCheck.remaining, rateCheck.resetTime);
        }

        // Read and hash request body for replay attack detection
        const body = await request.json();
        const bodyHash = crypto
            .createHash('sha256')
            .update(JSON.stringify(body))
            .digest('hex');

        // Detect replay attacks
        if (detectReplayAttack(ip, '/api/reviews', bodyHash)) {
            logSecurityEvent('Potential replay attack detected', ip, { endpoint: '/api/reviews' });
            return badRequestResponse('Duplicate request detected');
        }

        // Validate payload size and structure
        const validation = validateJsonPayload(body, 5120); // 5KB limit
        if (!validation.valid) {
            logSecurityEvent('Invalid payload', ip, { reason: validation.reason });
            return badRequestResponse(validation.reason || 'Invalid payload');
        }

        const { facultyId, rating, comment } = body;

        // Validate faculty ID
        const idValidation = validateFacultyId(facultyId);
        if (!idValidation.valid) {
            logSecurityEvent('Invalid faculty ID', ip, { facultyId });
            return NextResponse.json({ error: idValidation.error }, { status: 400 });
        }

        // Validate review input (includes banned words check)
        const reviewValidation = validateReviewInput(rating, comment || '');
        if (!reviewValidation.valid) {
            logSecurityEvent('Invalid review input', ip, {
                reason: reviewValidation.error,
            });
            return NextResponse.json({ error: reviewValidation.error }, { status: 400 });
        }

        // Attempt insertion trying both possible column names to handle schema typo
        const candidateColumns = ['faculty_id', 'facult_id'];
        let lastError: any = null;
        let usedColumn: string | null = null;
        let insertedData: any = null;

        for (const col of candidateColumns) {
            const payload: Record<string, any> = { rating, comment: comment || null };
            payload[col] = facultyId;

            const { data, error } = await supabase.from('reviews').insert(payload).select();

            if (!error) {
                usedColumn = col;
                insertedData = data;
                break;
            }

            lastError = error;

            const errMsg = String((error as any)?.message || '').toLowerCase();
            const errDetails = String((error as any)?.details || '').toLowerCase();

            // If RLS prevented the request, return immediately
            if (errMsg.includes('row level security') || errDetails.includes('row level security')) {
                console.error('RLS blocked insert:', error);
                logSecurityEvent('RLS blocked review insert', ip, { facultyId });
                if (process.env.NODE_ENV !== 'production') {
                    return NextResponse.json(
                        {
                            error: 'Row level security prevented the request',
                            details: (error as any)?.message || null,
                            hint: (error as any)?.details || null,
                        },
                        { status: 500 }
                    );
                }
                return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
            }

            // If the error indicates a missing column, try the next candidate
            if (
                errMsg.includes('column') ||
                (error as any)?.code === '42703' ||
                errDetails.includes('column')
            ) {
                console.warn(`Column ${col} not usable, trying next candidate.`);
                continue;
            }

            // Any other error - stop and return
            console.error('Database error on insert attempt:', error);
            logSecurityEvent('Database error on review insert', ip, {
                error: (error as any)?.message,
            });
            if (process.env.NODE_ENV !== 'production') {
                return NextResponse.json(
                    {
                        error: 'Failed to submit review',
                        details: (error as any)?.message || null,
                        hint: (error as any)?.details || null,
                    },
                    { status: 500 }
                );
            }
            return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
        }

        if (!usedColumn) {
            console.error('Insert failed for all candidate columns:', lastError);
            logSecurityEvent('Insert failed for all columns', ip, { facultyId });
            if (process.env.NODE_ENV !== 'production') {
                return NextResponse.json(
                    {
                        error: 'Failed to submit review',
                        details: (lastError as any)?.message || null,
                        hint: (lastError as any)?.details || null,
                    },
                    { status: 500 }
                );
            }
            return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
        }

        console.log(`Inserted review using column: ${usedColumn}`);
        return NextResponse.json(
            { success: true, data: insertedData, usedColumn },
            { status: 201 }
        );
    } catch (error) {
        console.error('API error:', error);
        const ip = getClientIp(request);
        logSecurityEvent('Unhandled error in POST /api/reviews', ip, {
            error: String(error),
        });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const ip = getClientIp(request);

        // Rate limiting for read operations (100 requests per hour)
        const rateCheck = checkRateLimit(ip, {
            maxRequests: 100,
            windowMs: 3600000,
            blockDurationMs: 600000,
        });

        if (!rateCheck.allowed) {
            logSecurityEvent('Rate limit exceeded on GET /api/reviews', ip, {
                remaining: rateCheck.remaining,
            });
            return rateLimitResponse(rateCheck.remaining, rateCheck.resetTime);
        }

        const { searchParams } = new URL(request.url);
        const facultyId = searchParams.get('facultyId');

        if (!facultyId) {
            return NextResponse.json({ error: 'Faculty ID is required' }, { status: 400 });
        }

        const idValidation = validateFacultyId(facultyId);
        if (!idValidation.valid) {
            logSecurityEvent('Invalid faculty ID in GET', ip, { facultyId });
            return NextResponse.json({ error: idValidation.error }, { status: 400 });
        }

        // Try selecting by either `faculty_id` or the typo `facult_id` if needed
        const candidateColumns = ['faculty_id', 'facult_id'];
        let lastError: any = null;
        let rows: any = null;
        let usedColumn: string | null = null;

        for (const col of candidateColumns) {
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .eq(col, Number(facultyId))
                .order('created_at', { ascending: false });

            if (!error) {
                rows = data;
                usedColumn = col;
                break;
            }

            lastError = error;
            const errMsg = String((error as any)?.message || '').toLowerCase();
            const errDetails = String((error as any)?.details || '').toLowerCase();

            if (errMsg.includes('row level security') || errDetails.includes('row level security')) {
                console.error('RLS blocked select:', error);
                logSecurityEvent('RLS blocked review select', ip, { facultyId });
                if (process.env.NODE_ENV !== 'production') {
                    return NextResponse.json(
                        {
                            error: 'Row level security prevented the request',
                            details: (error as any)?.message || null,
                            hint: (error as any)?.details || null,
                        },
                        { status: 500 }
                    );
                }
                return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
            }

            if (
                errMsg.includes('column') ||
                (error as any)?.code === '42703' ||
                errDetails.includes('column')
            ) {
                console.warn(`Column ${col} not usable for select, trying next.`);
                continue;
            }

            console.error('Database error on select:', error);
            logSecurityEvent('Database error on review select', ip, {
                error: (error as any)?.message,
            });
            if (process.env.NODE_ENV !== 'production') {
                return NextResponse.json(
                    {
                        error: 'Failed to fetch reviews',
                        details: (error as any)?.message || null,
                        hint: (error as any)?.details || null,
                    },
                    { status: 500 }
                );
            }
            return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
        }

        if (!usedColumn) {
            console.error('Select failed for all candidate columns:', lastError);
            logSecurityEvent('Select failed for all columns', ip, { facultyId });
            if (process.env.NODE_ENV !== 'production') {
                return NextResponse.json(
                    {
                        error: 'Failed to fetch reviews',
                        details: (lastError as any)?.message || null,
                        hint: (lastError as any)?.details || null,
                    },
                    { status: 500 }
                );
            }
            return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
        }

        console.log(`Fetched reviews using column: ${usedColumn}`);
        return NextResponse.json(
            { data: rows, usedColumn },
            {
                headers: {
                    'Cache-Control': 'private, max-age=60',
                    'X-RateLimit-Remaining': rateCheck.remaining.toString(),
                },
            }
        );
    } catch (error) {
        console.error('API error:', error);
        const ip = getClientIp(request);
        logSecurityEvent('Unhandled error in GET /api/reviews', ip, { error: String(error) });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
