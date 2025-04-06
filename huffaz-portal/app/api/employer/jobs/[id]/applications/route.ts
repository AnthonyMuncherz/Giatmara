import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getTokenFromCookies, verifyToken } from '@/app/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Await params resolution before accessing properties
    const { id } = await Promise.resolve(params);
    const jobId = id;
    console.log(`Fetching applications for job ID: ${jobId}`);

    const token = await getTokenFromCookies();

    if (!token) {
      console.log('No authentication token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded || !decoded.id || decoded.role !== 'EMPLOYER') {
      console.log('Invalid token or not an employer', decoded);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use the resolved jobId
    console.log(`Employer ID: ${decoded.id}, Job ID: ${jobId}`);

    // Check if job exists and belongs to this employer
    let job;
    try {
      job = await prisma.jobPosting.findUnique({
        where: { id: jobId }
      });
    } catch (dbError) {
      console.error('Database error when finding job:', dbError);
      return NextResponse.json({
        error: 'Database error when finding job',
        details: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
    }

    if (!job) {
      console.log(`Job not found: ${jobId}`);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.adminId !== decoded.id) {
      console.log(`Unauthorized: Job belongs to admin ${job.adminId}, not ${decoded.id}`);
      return NextResponse.json(
        { error: 'You do not have permission to view applications for this job' },
        { status: 403 }
      );
    }

    // Get applications for this job with user profiles
    let applications;
    try {
      applications = await prisma.application.findMany({
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

      console.log(`Found ${applications.length} applications for job ${jobId}`);
    } catch (dbError) {
      console.error('Database error when finding applications:', dbError);
      return NextResponse.json({
        error: 'Database error when finding applications',
        details: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
    }

    // Return empty array if no applications
    if (!applications) {
      return NextResponse.json({ applications: [] });
    }

    // Format the response
    try {
      const formattedApplications = applications.map(app => {
        // Safely handle date serialization
        let createdAtStr = '';
        let updatedAtStr = '';

        try {
          createdAtStr = app.createdAt instanceof Date ? app.createdAt.toISOString() : String(app.createdAt);
        } catch (e) {
          console.error('Error serializing createdAt:', e);
          createdAtStr = new Date().toISOString();
        }

        try {
          updatedAtStr = app.updatedAt instanceof Date ? app.updatedAt.toISOString() : String(app.updatedAt);
        } catch (e) {
          console.error('Error serializing updatedAt:', e);
          updatedAtStr = new Date().toISOString();
        }

        return {
          id: app.id,
          userId: app.userId,
          status: app.status,
          notes: app.notes || "",
          createdAt: createdAtStr,
          updatedAt: updatedAtStr,
          studentName: app.user?.profile ? `${app.user.profile.firstName} ${app.user.profile.lastName}` : 'Unknown',
          studentEmail: app.user?.email || 'Unknown',
          resumeUrl: app.user?.profile?.resumeUrl
        };
      });

      // Log the complete formatted applications to diagnose issues
      console.log('Formatted applications:', JSON.stringify(formattedApplications, null, 2));

      return NextResponse.json({ applications: formattedApplications });
    } catch (formatError) {
      console.error('Error formatting applications data:', formatError);
      return NextResponse.json({
        error: 'Error formatting application data',
        details: formatError instanceof Error ? formatError.message : String(formatError)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error fetching job applications:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
