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
} from '@/lib/ddos-protection';
import { validateSearchQuery } from '@/lib/validation';

export async function GET(request: NextRequest) {
    try {
        const ip = getClientIp(request);

        // Rate limiting (stricter for search/list operations)
        const rateCheck = checkRateLimit(ip, {
            maxRequests: 200,
            windowMs: 60000,
            blockDurationMs: 300000,
        });

        if (!rateCheck.allowed) {
            logSecurityEvent('Rate limit exceeded', ip, { endpoint: '/api/faculty' });
            return rateLimitResponse(rateCheck.remaining, rateCheck.resetTime);
        }

        const { searchParams } = new URL(request.url);
        const university = searchParams.get('university');
        const department = searchParams.get('department');
        const search = searchParams.get('search');
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(5000, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
        const offset = (page - 1) * limit;

        // Validate search query
        if (search) {
            const validation = validateSearchQuery(search);
            if (!validation.valid) {
                logSecurityEvent('Invalid search query', ip, { reason: validation.error });
                return badRequestResponse(validation.error || 'Invalid search');
            }
        }

        // Build query - include pagination
        let query = supabase.from('faculty').select('*', { count: 'exact' }).range(offset, offset + limit - 1);

        // Apply filters safely
        if (university && university !== 'All' && university.length < 100) {
            query = query.ilike('university', `%${university}%`);
        }

        if (department && department !== 'All' && department.length < 100) {
            // Use ILIKE for case-insensitive partial matching
            query = query.ilike('department', `%${department}%`);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Failed to fetch faculty' }, { status: 500 });
        }

        // Client-side search for additional filtering
        let filteredData = data || [];
        if (search) {
            const queryLower = search.toLowerCase();
            filteredData = filteredData.filter(
                (faculty: any) =>
                    faculty.name?.toLowerCase().includes(queryLower) ||
                    faculty.designation?.toLowerCase().includes(queryLower) ||
                    faculty.department?.toLowerCase().includes(queryLower)
            );
        }

        const totalCount = search ? filteredData.length : (count || filteredData.length);
        const totalPages = Math.ceil(totalCount / limit);

        return NextResponse.json(
            {
                data: filteredData,
                pagination: {
                    page,
                    limit,
                    total: totalCount,
                    pages: totalPages,
                    hasMore: page < totalPages,
                },
            },
            {
                headers: {
                    'Cache-Control': 'public, max-age=300, s-maxage=3600',
                    'X-RateLimit-Remaining': rateCheck.remaining.toString(),
                },
            }
        );
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

