import { NextRequest, NextResponse } from 'next/server'; // Import NextRequest
import prisma from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth'; // Use getCurrentUser

// --- GET Handler (Get Job Details) ---
export async function GET(
  request: NextRequest, // Accept request
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request); // Pass request

    // Await params resolution before accessing properties
    const { id } = await Promise.resolve(params);
    const jobId = id;
    console.log(`Fetching job details for ID: ${jobId}`);

    if (!user || !user.id || user.role !== 'EMPLOYER') {
      if (!user) {
        console.log('No authentication token found');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      console.log('Invalid token or not an employer', user);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use the resolved jobId
    console.log(`Employer ID: ${user.id}, Job ID: ${jobId}`);

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
    if (job.adminId !== user.id) {
      console.log(`Unauthorized: Job belongs to admin ${job.adminId}, not ${user.id}`);
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
        mbtiTypes: job.mbtiTypes || null, // Keep as string
        deadline: job.deadline.toISOString(), // Serialize date
        status: job.status || "ACTIVE",
        createdAt: job.createdAt.toISOString(), // Serialize date
        updatedAt: job.updatedAt.toISOString(), // Serialize date
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


// --- PATCH Handler (Update Job) ---
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
    const requestBody = await request.json();

    const {
      title,
      company,
      location,
      salary,
      description,
      requirements,
      responsibilities,
      benefits,
      employmentType,
      mbtiTypes, // Expecting string from frontend
      deadline,
      status // Allow updating status too if needed
    } = requestBody;

    // Validate required fields
    if (!title || !company || !location || !description || !requirements || !deadline) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate deadline format
    let deadlineDate;
    try {
      deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        throw new Error('Invalid date format');
      }
    } catch (e) {
      return NextResponse.json({ error: 'Invalid deadline date format. Use YYYY-MM-DD.' }, { status: 400 });
    }


    // Find the existing job to verify ownership
    const existingJob = await prisma.jobPosting.findUnique({
      where: { id: jobId },
    });

    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if the job belongs to the authenticated employer
    if (existingJob.adminId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this job' },
        { status: 403 }
      );
    }

    // Prepare update data, ensuring mbtiTypes is stored as a string
    const updateData: any = {
      title,
      company,
      location,
      description,
      requirements,
      deadline: deadlineDate,
      // Optional fields
      ...(salary !== undefined && { salary }),
      ...(responsibilities !== undefined && { responsibilities }),
      ...(benefits !== undefined && { benefits }),
      ...(employmentType !== undefined && { employmentType }),
      ...(mbtiTypes !== undefined && { mbtiTypes: String(mbtiTypes) }), // Ensure it's saved as string
      ...(status && ['ACTIVE', 'INACTIVE'].includes(status) && { status }), // Optional status update
    };


    // Update the job posting
    const updatedJob = await prisma.jobPosting.update({
      where: { id: jobId },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Job updated successfully',
      job: updatedJob
    });

  } catch (error) {
    console.error('Error updating job:', error);
    // Handle potential Prisma errors like P2025 (RecordNotFound) if needed
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
