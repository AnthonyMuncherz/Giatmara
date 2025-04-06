import { NextRequest, NextResponse } from 'next/server'; // Import NextRequest
import prisma from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth'; // Use getCurrentUser

export async function PATCH(
  request: NextRequest, // Accept request
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request); // Pass request

    if (!user || !user.id || user.role !== 'EMPLOYER') {
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      include: { jobPosting: true } // Include jobPosting to check adminId
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check if job belongs to this employer
    if (application.jobPosting.adminId !== user.id) {
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
      application: updatedApplication // Return the updated application
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    if ((error as any).code === 'P2025') { // Handle Prisma not found error
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
