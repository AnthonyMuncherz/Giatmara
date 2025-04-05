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
    
    // Check if job exists and belongs to this employer
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId }
    });
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    if (job.adminId !== decoded.id) {
      return NextResponse.json(
        { error: 'You do not have permission to view applications for this job' },
        { status: 403 }
      );
    }
    
    // Get applications for this job with user profiles
    const applications = await prisma.application.findMany({
      where: { jobPostingId: jobId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                resumeUrl: true
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    
    // Format the response
    const formattedApplications = applications.map(app => ({
      id: app.id,
      userId: app.userId,
      status: app.status,
      notes: app.notes,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      studentName: app.user.profile ? `${app.user.profile.firstName} ${app.user.profile.lastName}` : 'Unknown',
      studentEmail: app.user.email,
      resumeUrl: app.user.profile?.resumeUrl
    }));
    
    return NextResponse.json({ applications: formattedApplications });
  } catch (error) {
    console.error('Error fetching job applications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 