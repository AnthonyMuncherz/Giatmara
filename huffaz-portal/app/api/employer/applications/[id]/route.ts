import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getTokenFromCookies, verifyToken } from '@/app/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getTokenFromCookies();

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded || !decoded.id || decoded.role !== 'EMPLOYER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Await params resolution
    const { id } = await Promise.resolve(params);
    const applicationId = id;

    console.log(`Fetching application details for ID: ${applicationId}`);

    // Get application details, including related user and job posting
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          select: {
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
                mbtiType: true,
                resumeUrl: true,
                certificateUrl: true,
              },
            },
          },
        },
        jobPosting: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            adminId: true, // Needed for ownership check
          },
        },
      },
    });

    if (!application) {
      console.log(`Application not found: ${applicationId}`);
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Verify job belongs to this employer
    if (application.jobPosting.adminId !== decoded.id) {
      console.log(`Unauthorized: Job belongs to admin ${application.jobPosting.adminId}, not ${decoded.id}`);
      return NextResponse.json(
        { error: 'You do not have permission to view this application' },
        { status: 403 }
      );
    }

    console.log(`Found application for job: ${application.jobPosting.title}`);

    // Format the response (optional, but good practice)
    const formattedApplication = {
      id: application.id,
      status: application.status,
      notes: application.notes,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      applicant: {
        name: `${application.user.profile?.firstName || ''} ${application.user.profile?.lastName || ''}`.trim() || 'Unknown Applicant',
        email: application.user.email,
        phone: application.user.profile?.phone,
        mbtiType: application.user.profile?.mbtiType,
        resumeUrl: application.user.profile?.resumeUrl,
        certificateUrl: application.user.profile?.certificateUrl,
      },
      job: {
        id: application.jobPosting.id,
        title: application.jobPosting.title,
        company: application.jobPosting.company,
        location: application.jobPosting.location,
      }
    };

    return NextResponse.json({ application: formattedApplication });

  } catch (error) {
    console.error('Error fetching application details:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
