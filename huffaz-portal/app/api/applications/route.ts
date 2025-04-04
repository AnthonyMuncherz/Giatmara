import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getTokenFromCookies, verifyToken } from '@/app/lib/auth';

interface DecodedToken {
  id: string;
  email: string;
  role: string;
}

export async function GET() {
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

    // Get all applications with user and job posting details
    const applications = await prisma.application.findMany({
      include: {
        user: {
          select: {
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                mbtiType: true,
                resumeUrl: true,
                certificateUrl: true
              }
            }
          }
        },
        jobPosting: {
          select: {
            title: true,
            company: true,
            location: true,
            mbtiTypes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      applications
    });
  } catch (error) {
    console.error('Get applications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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

    const body = await request.json();
    const { jobPostingId } = body;

    // Check if profile has required documents
    const profile = await prisma.profile.findUnique({
      where: { userId: decoded.id },
      select: { resumeUrl: true, certificateUrl: true }
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Check if required documents are uploaded
    if (!profile.resumeUrl || !profile.certificateUrl) {
      const missingDocs = [];
      if (!profile.resumeUrl) missingDocs.push('resume');
      if (!profile.certificateUrl) missingDocs.push('GiatMARA Skills Certificate');
      
      return NextResponse.json(
        { 
          error: `You must upload your ${missingDocs.join(' and ')} before applying`,
          missingDocuments: missingDocs,
          code: 'MISSING_DOCUMENTS'
        },
        { status: 400 }
      );
    }

    // Check if job exists and is still active
    const job = await prisma.jobPosting.findUnique({
      where: {
        id: jobPostingId,
        status: 'ACTIVE',
        deadline: {
          gte: new Date(),
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found or no longer active' },
        { status: 404 }
      );
    }

    // Check if user has already applied
    const existingApplication = await prisma.application.findFirst({
      where: {
        userId: decoded.id,
        jobPostingId,
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied for this position' },
        { status: 400 }
      );
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        userId: decoded.id,
        jobPostingId,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      message: 'Application submitted successfully',
      applicationId: application.id,
    });
  } catch (error) {
    console.error('Create application error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 