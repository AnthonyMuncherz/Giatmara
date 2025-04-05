import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromCookies } from '@/app/lib/auth';
import prisma from '@/app/lib/db';

export async function GET() {
  try {
    const token = await getTokenFromCookies();
    
    if (!token) {
      return NextResponse.json({ user: null });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.id) {
      return NextResponse.json({ user: null });
    }

    // Get user from database (without password)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id as string },
      select: {
        id: true,
        email: true,
        role: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({ user: null });
    }
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : undefined
      }
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null });
  }
} 