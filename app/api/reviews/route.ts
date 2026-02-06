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

        // Insert review with RLS (Row Level Security)
        const { data, error } = await supabase
            .from('reviews')
            .insert({
                faculty_id: facultyId,
                rating,
                comment: comment || null,
            })
            .select();

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Failed to submit review' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: true, data },
            { status: 201 }
        );
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

        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('faculty_id', Number(facultyId))
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch reviews' },
                { status: 500 }
            );
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
