import { compare, hash } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server'; // Import NextRequest

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

export function generateToken(payload: Record<string, unknown>): string {
  return sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): Record<string, unknown> | null {
  try {
    // Ensure the secret is defined
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not defined!');
      return null;
    }
    // Use Buffer.from for secret if it's base64 encoded or needs specific encoding
    // If it's a plain string, JWT_SECRET is fine.
    return verify(token, JWT_SECRET) as Record<string, unknown>;
  } catch (error) {
    // Log verification errors for debugging
    // Avoid logging "invalid signature" or "jwt expired" as these are common
    if (!(error instanceof Error && (error.message.includes('invalid signature') || error.message.includes('jwt expired')))) {
      console.error('Token verification failed:', error instanceof Error ? error.message : String(error));
    }
    return null;
  }
}

// Modified getTokenFromCookies
// It now prioritizes the request object if provided (for API Routes)
// Falls back to next/headers cookies() for other contexts (Server Components, etc.)
export async function getTokenFromCookies(request?: NextRequest): Promise<string | null> {
  try {
    // Prioritize reading from the request object if provided (for API routes)
    if (request) {
      const tokenFromRequest = request.cookies.get('token')?.value;
      if (tokenFromRequest) {
        return tokenFromRequest;
      }
    }

    // Fallback to next/headers cookies() (for Server Components, etc.)
    // This might throw an error if called outside a request context (e.g., during build)
    // Use a try-catch specifically for this part if needed, but often it's called within a valid context.
    const cookieStore = await cookies(); // Add await here to fix the issue
    const tokenFromStore = cookieStore.get('token')?.value;
    return tokenFromStore || null;
  } catch (error) {
    // Avoid logging errors when cookies() is called outside a request context
    // These errors are expected during build time or in certain environments.
    if (error instanceof Error && !error.message.includes('cookies()')) {
      console.error('Error getting token from cookies:', error);
    }
    // If called outside a request context where cookies are unavailable, return null.
    return null;
  }
}


// Modified getCurrentUser
// Accepts optional request object to pass down to getTokenFromCookies
export async function getCurrentUser(request?: NextRequest): Promise<Record<string, any> | null> { // Return type adjusted
  try {
    const token = await getTokenFromCookies(request); // Pass request
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    // Return the decoded payload which should contain user info (id, role, etc.)
    return decoded;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
