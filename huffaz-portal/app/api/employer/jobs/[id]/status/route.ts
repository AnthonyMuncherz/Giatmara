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
    
    const jobId = params.id;
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
    
    if (job.adminId !== decoded.id) {
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 