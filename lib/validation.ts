// Input validation and sanitization
import { containsBannedWords } from './bannedWords';

export function validateReviewInput(rating: number, comment: string): { valid: boolean; error?: string } {
    try {
        if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
            return { valid: false, error: 'Rating must be an integer between 1 and 5' };
        }

        if (comment && typeof comment !== 'string') {
            return { valid: false, error: 'Comment must be a string' };
        }

        if (comment && comment.length > 500) {
            return { valid: false, error: 'Comment must be less than 500 characters' };
        }

        // Check for potential XSS patterns
        if (comment && containsDangerousPatterns(comment)) {
            return { valid: false, error: 'Comment contains invalid characters' };
        }

        // Check for banned words
        if (comment && comment.trim().length > 0) {
            const bannedCheck = containsBannedWords(comment);
            if (bannedCheck.contains) {
                return {
                    valid: false,
                    error: `This website is for reviewing teachers, not taking out personal grudges. Please keep your review professional and respectful.`
                };
            }
        }

        return { valid: true };
    } catch (err) {
        console.error('Validation error:', err);
        return { valid: false, error: 'An error occurred while validating your input. Please try again.' };
    }
}

export function validateFacultyId(id: any): { valid: boolean; error?: string } {
    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
        return { valid: false, error: 'Invalid faculty ID' };
    }

    return { valid: true };
}

export function validateSearchQuery(query: string): { valid: boolean; error?: string } {
    if (!query || typeof query !== 'string') {
        return { valid: false, error: 'Invalid search query' };
    }

    if (query.length > 100) {
        return { valid: false, error: 'Search query too long' };
    }

    // Remove potentially dangerous characters
    if (containsDangerousPatterns(query)) {
        return { valid: false, error: 'Invalid search characters' };
    }

    return { valid: true };
}

function containsDangerousPatterns(str: string): boolean {
    // Check for SQL injection patterns
    const sqlPatterns = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT|JAVASCRIPT|ONERROR|ONLOAD|IFRAME)\b|--|;|\/\*|\*\/|xp_|sp_)/gi;

    // Check for XSS patterns
    const xssPatterns = /(<script|<iframe|javascript:|onerror=|onload=|onclick=|<svg|<img)/gi;

    return sqlPatterns.test(str) || xssPatterns.test(str);
}

// Sanitize output
export function sanitizeString(str: string): string {
    if (!str) return '';

    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}
