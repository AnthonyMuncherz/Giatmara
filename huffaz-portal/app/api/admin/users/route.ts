import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getCurrentUser, verifyToken } from '@/app/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get current user from token
    const user = await getCurrentUser();
    
    // Check if user is authenticated and is an admin
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }
    
    // Fetch all users with their profiles
    const users = await prisma.user.findMany({
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            mbtiType: true,
            mbtiCompleted: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Return users
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 