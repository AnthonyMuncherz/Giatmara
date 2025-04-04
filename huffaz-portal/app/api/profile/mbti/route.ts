import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getTokenFromCookies, verifyToken } from '@/app/lib/auth';

export async function POST(request: Request) {
  try {
    const token = await getTokenFromCookies();
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { mbtiType } = body;

    if (!mbtiType) {
      return NextResponse.json(
        { error: 'MBTI type is required' },
        { status: 400 }
      );
    }

    // Get user profile
    const userProfile = await prisma.profile.findUnique({
      where: { userId: decoded.id },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Update MBTI information
    const updatedProfile = await prisma.profile.update({
      where: { userId: decoded.id },
      data: {
        mbtiType,
        mbtiCompleted: true,
      },
    });

    return NextResponse.json({
      message: 'MBTI information updated successfully',
      profile: {
        mbtiType: updatedProfile.mbtiType,
        mbtiCompleted: updatedProfile.mbtiCompleted,
      },
    });
  } catch (error) {
    console.error('Error updating MBTI information:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 