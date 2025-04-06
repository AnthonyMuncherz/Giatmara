import { NextRequest, NextResponse } from 'next/server'; // Import NextRequest
import prisma from '@/app/lib/db';
import { getTokenFromCookies, verifyToken, getCurrentUser } from '@/app/lib/auth'; // Import getCurrentUser

export async function GET(request: NextRequest) { // Accept request
  try {
    // Use getCurrentUser, passing the request object
    const decoded = await getCurrentUser(request);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user with profile using decoded ID
    const user = await prisma.user.findUnique({
      where: { id: decoded.id as string }, // Use ID from decoded token
      include: {
        profile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.profile) {
      // Optionally create a profile if it doesn't exist, or return error
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Remove sensitive information
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json({
      profile: user.profile,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) { // Accept request
  try {
    // Use getCurrentUser, passing the request object
    const decoded = await getCurrentUser(request);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, phone, mbtiType, mbtiCompleted } = body;

    // Update profile using decoded ID
    const updatedProfile = await prisma.profile.update({
      where: { userId: decoded.id as string }, // Use ID from decoded token
      data: {
        ...(firstName !== undefined && { firstName }), // Check for undefined to allow clearing fields
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }), // Allow null or empty string
        ...(mbtiType !== undefined && { mbtiType }), // Allow null or empty string
        ...(mbtiCompleted !== undefined && { mbtiCompleted }),
      },
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    // Handle Prisma error if profile doesn't exist for update
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ error: 'Profile not found for update' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
