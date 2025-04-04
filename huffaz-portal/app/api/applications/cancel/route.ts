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
    const { applicationId } = body;

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    // Check if application exists and belongs to the user
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        userId: decoded.id,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found or access denied' },
        { status: 404 }
      );
    }

    // Check if application is still pending
    if (application.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending applications can be cancelled' },
        { status: 400 }
      );
    }

    // Cancel application (delete it)
    await prisma.application.delete({
      where: {
        id: applicationId,
      },
    });

    return NextResponse.json({
      message: 'Application cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel application error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 