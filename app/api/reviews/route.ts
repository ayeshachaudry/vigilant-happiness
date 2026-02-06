import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { rateLimit } from '@/lib/rateLimit';
import { validateReviewInput, validateFacultyId } from '@/lib/validation';

// Helper to extract client IP securely
function getClientIp(request: NextRequest): string {
    // Try multiple header sources, take the first (most trusted)
    const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (forwardedFor && isValidIp(forwardedFor)) return forwardedFor;

    const realIp = request.headers.get('x-real-ip')?.trim();
    if (realIp && isValidIp(realIp)) return realIp;

    // Fallback - use consistent identifier but log warning
    console.warn('[Security] Could not determine client IP from headers');
    return 'unknown';
}

function isValidIp(ip: string): boolean {
    // Simple IPv4/IPv6 validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}$/i;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

export async function POST(request: NextRequest) {
    try {
        // Rate limiting - Extract real IP securely
        const ip = getClientIp(request);
        if (!rateLimit(ip, 50, 3600000)) { // 50 requests per hour
            return NextResponse.json(
                { error: '⚠️ This website is for reviewing teachers, not taking out your personal grudges on them. Please wait before submitting another review.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { facultyId, rating, comment } = body;

        // Validate faculty ID
        const idValidation = validateFacultyId(facultyId);
        if (!idValidation.valid) {
            return NextResponse.json(
                { error: idValidation.error },
                { status: 400 }
            );
        }

        // Validate review input (includes banned words check)
        const validation = validateReviewInput(rating, comment || '');
        if (!validation.valid) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400 }
            );
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

            // If RLS prevented the request, return immediately with helpful message
            if (errMsg.includes('row level security') || errDetails.includes('row level security')) {
                console.error('RLS blocked insert:', error);
                if (process.env.NODE_ENV !== 'production') {
                    return NextResponse.json({ error: 'Row level security prevented the request', details: (error as any)?.message || null, hint: (error as any)?.details || null }, { status: 500 });
                }
                return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
            }

            // If the error indicates a missing column, try the next candidate
            if (errMsg.includes('column') || (error as any)?.code === '42703' || errDetails.includes('column')) {
                console.warn(`Column ${col} not usable, trying next candidate if any.`);
                continue;
            }

            // Any other error - stop and return it
            console.error('Database error on insert attempt:', error);
            if (process.env.NODE_ENV !== 'production') {
                return NextResponse.json({ error: 'Failed to submit review', details: (error as any)?.message || null, hint: (error as any)?.details || null }, { status: 500 });
            }
            return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
        }

        if (!usedColumn) {
            // Nothing succeeded
            try {
                console.error('Insert failed for all candidate columns:', JSON.stringify(lastError, Object.getOwnPropertyNames(lastError)));
            } catch (e) {
                console.error('Insert failed (stringify failed):', lastError);
            }
            if (process.env.NODE_ENV !== 'production') {
                return NextResponse.json({ error: 'Failed to submit review', details: (lastError as any)?.message || null, hint: (lastError as any)?.details || null }, { status: 500 });
            }
            return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
        }

        console.log(`Inserted review using column: ${usedColumn}`);
        return NextResponse.json({ success: true, data: insertedData, usedColumn }, { status: 201 });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        // Rate limiting for read operations
        const ip = getClientIp(request);
        if (!rateLimit(ip, 200, 3600000)) { // 200 requests per hour
            return NextResponse.json(
                { error: 'Rate limit exceeded' },
                { status: 429 }
            );
        }

        const { searchParams } = new URL(request.url);
        const facultyId = searchParams.get('facultyId');

        if (!facultyId) {
            return NextResponse.json(
                { error: 'Faculty ID is required' },
                { status: 400 }
            );
        }

        const idValidation = validateFacultyId(facultyId);
        if (!idValidation.valid) {
            return NextResponse.json(
                { error: idValidation.error },
                { status: 400 }
            );
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
                if (process.env.NODE_ENV !== 'production') {
                    return NextResponse.json({ error: 'Row level security prevented the request', details: (error as any)?.message || null, hint: (error as any)?.details || null }, { status: 500 });
                }
                return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
            }

            if (errMsg.includes('column') || (error as any)?.code === '42703' || errDetails.includes('column')) {
                console.warn(`Column ${col} not usable for select, trying next candidate.`);
                continue;
            }

            console.error('Database error on select attempt:', error);
            if (process.env.NODE_ENV !== 'production') {
                return NextResponse.json({ error: 'Failed to fetch reviews', details: (error as any)?.message || null, hint: (error as any)?.details || null }, { status: 500 });
            }
            return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
        }

        if (!usedColumn) {
            console.error('Select failed for all candidate columns:', lastError);
            if (process.env.NODE_ENV !== 'production') {
                return NextResponse.json({ error: 'Failed to fetch reviews', details: (lastError as any)?.message || null, hint: (lastError as any)?.details || null }, { status: 500 });
            }
            return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
        }

        console.log(`Fetched reviews using column: ${usedColumn}`);
        return NextResponse.json({ data: rows, usedColumn });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
