import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getTokenFromCookies, verifyToken } from '@/app/lib/auth';

// Get all jobs created by the employer
export async function GET() {
  try {
    const token = await getTokenFromCookies();
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.id || decoded.role !== 'EMPLOYER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get all jobs created by this employer with application count
    // @ts-ignore - Handle adminId field
    const jobs = await prisma.jobPosting.findMany({
      where: {
        adminId: decoded.id as string,
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
      deadline: job.deadline,
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
export async function POST(request: Request) {
  try {
    const token = await getTokenFromCookies();
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.id || decoded.role !== 'EMPLOYER') {
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
      mbtiTypes, 
      deadline 
    } = requestBody;
    
    // Validate required fields
    if (!title || !company || !location || !description || !requirements || !deadline) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // @ts-ignore - Use adminId field
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
        mbtiTypes,
        deadline: new Date(deadline),
        status: 'ACTIVE',
        adminId: decoded.id as string,
      },
    });
    
    return NextResponse.json({ 
      message: 'Job created successfully', 
      job 
    });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 