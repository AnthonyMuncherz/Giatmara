import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getTokenFromCookies, verifyToken } from '@/app/lib/auth';

export async function PATCH(
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
    const { status } = await request.json();

    // Validate status
    const validStatuses = ['PENDING', 'INTERVIEWING', 'ACCEPTED', 'REJECTED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
        { status: 400 }
      );
    }

    // Check if application exists
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { jobPosting: true }
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check if job belongs to this employer
    if (application.jobPosting.adminId !== decoded.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this application' },
        { status: 403 }
      );
    }

    // Update the application status
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { status: status as 'PENDING' | 'INTERVIEWING' | 'ACCEPTED' | 'REJECTED' }
    });

    return NextResponse.json({
      message: 'Application status updated successfully',
      application: updatedApplication
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
