import { compare, hash } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';

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
    return verify(token, JWT_SECRET) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function getTokenFromCookies(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get('token')?.value || null;
  } catch (error) {
    console.error('Error getting token from cookies:', error);
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const token = await getTokenFromCookies();
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    return decoded;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
} 