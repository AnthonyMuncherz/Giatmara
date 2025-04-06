import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Await params resolution
    const { id } = await Promise.resolve(params);
    const userId = id;

    // Fetch detailed user information including profile and applications
    const userDetail = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        applications: {
          include: {
            jobPosting: {
              select: {
                id: true,
                title: true,
                company: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!userDetail) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: userDetail });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
