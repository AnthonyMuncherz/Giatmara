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
    console.log(`Fetching job details for ID: ${jobId}`);

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

    // Get job with application count
    let job;
    try {
      job = await prisma.jobPosting.findUnique({
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
        console.log(`Job not found: ${jobId}`);
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
    } catch (dbError) {
      console.error('Database error finding job:', dbError);
      return NextResponse.json({
        error: 'Database error finding job details',
        details: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
    }

    // Verify job belongs to this employer
    if (job.adminId !== decoded.id) {
      console.log(`Unauthorized: Job belongs to admin ${job.adminId}, not ${decoded.id}`);
      return NextResponse.json(
        { error: 'You do not have permission to view this job' },
        { status: 403 }
      );
    }

    console.log(`Found job: ${job.title}, application count: ${job._count.applications}`);

    // Format job for the response
    try {
      const formattedJob = {
        id: job.id,
        title: job.title || "Untitled Job",
        company: job.company || "Unknown Company",
        location: job.location || "",
        salary: job.salary || "",
        description: job.description || "",
        requirements: job.requirements || "",
        responsibilities: job.responsibilities || "",
        benefits: job.benefits || "",
        employmentType: job.employmentType || "",
        mbtiTypes: job.mbtiTypes || [], // Changed default to empty array
        deadline: job.deadline,
        status: job.status || "ACTIVE",
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        applicationCount: job._count?.applications || 0
      };

      return NextResponse.json({ job: formattedJob });
    } catch (formatError) {
      console.error('Error formatting job data:', formatError);
      return NextResponse.json({
        error: 'Error formatting job data',
        details: formatError instanceof Error ? formatError.message : String(formatError)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error fetching job details:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
