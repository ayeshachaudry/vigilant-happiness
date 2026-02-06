import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { rateLimit } from '@/lib/rateLimit';
import { validateSearchQuery } from '@/lib/validation';

// Helper to extract client IP securely
function getClientIp(request: NextRequest): string {
    const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (forwardedFor && isValidIp(forwardedFor)) return forwardedFor;

    const realIp = request.headers.get('x-real-ip')?.trim();
    if (realIp && isValidIp(realIp)) return realIp;

    console.warn('[Security] Could not determine client IP from headers');
    return 'unknown';
}

function isValidIp(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}$/i;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

export async function GET(request: NextRequest) {
    try {
        // Rate limiting - Extract real IP securely
        const ip = getClientIp(request);
        if (!rateLimit(ip, 300, 3600000)) { // 300 requests per hour
            return NextResponse.json(
                { error: 'Rate limit exceeded' },
                { status: 429 }
            );
        }

        const { searchParams } = new URL(request.url);
        const university = searchParams.get('university');
        const department = searchParams.get('department');
        const search = searchParams.get('search');

        // Build query
        let query = supabase.from('faculty').select('*');

        // Apply filters
        if (university && university !== 'All') {
            query = query.eq('university', university);
        }

        if (department && department !== 'All') {
            query = query.eq('department', department);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch faculty' },
                { status: 500 }
            );
        }

        // Client-side search for flexibility (validate first)
        let filteredData = data || [];
        if (search) {
            const validation = validateSearchQuery(search);
            if (validation.valid) {
                const query = search.toLowerCase();
                filteredData = filteredData.filter(
                    (faculty: any) =>
                        faculty.name?.toLowerCase().includes(query) ||
                        faculty.designation?.toLowerCase().includes(query) ||
                        faculty.department?.toLowerCase().includes(query)
                );
            }
        }

        return NextResponse.json({ data: filteredData });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
