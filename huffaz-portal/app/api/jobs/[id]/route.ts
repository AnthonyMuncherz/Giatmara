import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getTokenFromCookies, verifyToken } from '@/app/lib/auth';
import jwt, { JwtPayload } from 'jsonwebtoken';

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Properly handle params which might be a promise in Next.js App Router
    const params = await Promise.resolve(context.params);
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const job = await prisma.jobPosting.findUnique({
      where: {
        id,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Error getting job details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }
    
    const token = await getTokenFromCookies();
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'ADMIN') {
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
      deadline,
      status 
    } = requestBody;
    
    const existingJob = await prisma.jobPosting.findUnique({
      where: { id },
    });
    
    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    const job = await prisma.jobPosting.update({
      where: { id },
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
        deadline: deadline ? new Date(deadline) : undefined,
        status,
      },
    });
    
    return NextResponse.json({ message: 'Job updated successfully', job });
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 