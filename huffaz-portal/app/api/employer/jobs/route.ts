import { NextRequest, NextResponse } from 'next/server'; // Import NextRequest
import prisma from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth'; // Use getCurrentUser

// Get all jobs created by the employer
export async function GET(request: NextRequest) { // Accept request
  try {
    const user = await getCurrentUser(request); // Pass request

    if (!user || !user.id || user.role !== 'EMPLOYER') {
      // Handle unauthorized/forbidden cases based on 'user' content
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all jobs created by this employer with application count
    const jobs = await prisma.jobPosting.findMany({
      where: {
        adminId: user.id as string,
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    // Format the response
    const formattedJobs = jobs.map(job => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      deadline: job.deadline.toISOString(), // Ensure date is serialized properly
      status: job.status,
      applications: job._count.applications
    }));

    return NextResponse.json({ jobs: formattedJobs });
  } catch (error) {
    console.error('Error fetching employer jobs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Create a new job posting
export async function POST(request: NextRequest) { // Accept request
  try {
    const user = await getCurrentUser(request); // Pass request

    if (!user || !user.id || user.role !== 'EMPLOYER') {
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
      mbtiTypes, // Keep as string
      deadline
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

    const job = await prisma.jobPosting.create({
      data: {
        title,
        company,
        location,
        salary,
        description,
        requirements,
        responsibilities,
        benefits,
        employmentType,
        mbtiTypes, // Store as string
        deadline: deadlineDate,
        status: 'ACTIVE', // Default status for new jobs
        adminId: user.id as string, // Use user.id from getCurrentUser
      },
    });

    return NextResponse.json({
      message: 'Job created successfully',
      job
    }, { status: 201 }); // Use 201 Created status
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
