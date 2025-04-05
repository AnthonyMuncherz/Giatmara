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
    
    const jobId = params.id;
    
    // Get job with application count
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        _count: {
          select: {
            applications: true
          }
        }
      }
    });
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    // Verify job belongs to this employer
    if (job.adminId !== decoded.id) {
      return NextResponse.json(
        { error: 'You do not have permission to view this job' },
        { status: 403 }
      );
    }
    
    // Format job for the response
    const formattedJob = {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      description: job.description,
      requirements: job.requirements,
      responsibilities: job.responsibilities,
      benefits: job.benefits,
      employmentType: job.employmentType,
      mbtiTypes: job.mbtiTypes,
      deadline: job.deadline,
      status: job.status,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      applicationCount: job._count.applications
    };
    
    return NextResponse.json({ job: formattedJob });
  } catch (error) {
    console.error('Error fetching job details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 