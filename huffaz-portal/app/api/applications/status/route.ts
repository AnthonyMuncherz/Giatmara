import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getTokenFromCookies, verifyToken } from '@/app/lib/auth';

interface DecodedToken {
  id: string;
  email: string;
  role: string;
}

export async function POST(request: Request) {
  try {
    const token = await getTokenFromCookies();
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token) as DecodedToken | null;
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Verify user is an admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { applicationId, status, notes } = body;

    if (!applicationId || !status) {
      return NextResponse.json(
        { error: 'Application ID and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['PENDING', 'REJECTED', 'INTERVIEWING', 'ACCEPTED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
        { status: 400 }
      );
    }

    // Update application status
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { 
        status,
        notes: notes || undefined
      },
      include: {
        user: {
          select: {
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        jobPosting: {
          select: {
            title: true,
            company: true,
            mbtiTypes: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Application status updated successfully',
      application: updatedApplication
    });
  } catch (error) {
    console.error('Update application status error:', error);
    
    // Handle not found error
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 