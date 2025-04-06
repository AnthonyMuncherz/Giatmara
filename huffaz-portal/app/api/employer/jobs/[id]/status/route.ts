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
    const jobId = id;
    const { status } = await request.json();

    // Validate status
    if (!status || (status !== 'ACTIVE' && status !== 'INACTIVE')) {
      return NextResponse.json(
        { error: 'Invalid status. Must be ACTIVE or INACTIVE' },
        { status: 400 }
      );
    }

    // Check if job exists and belongs to this employer
    const job = await prisma.jobPosting.findUnique({
      where: {
        id: jobId
      }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.adminId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this job' },
        { status: 403 }
      );
    }

    // Update the job status
    const updatedJob = await prisma.jobPosting.update({
      where: {
        id: jobId
      },
      data: {
        status
      }
    });

    return NextResponse.json({
      message: 'Job status updated successfully',
      job: updatedJob
    });
  } catch (error) {
    console.error('Error updating job status:', error);
    if ((error as any).code === 'P2025') { // Handle Prisma not found error
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
