import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getTokenFromCookies, verifyToken } from '@/app/lib/auth';
import jwt, { JwtPayload } from 'jsonwebtoken';

export async function GET() {
  try {
    const jobs = await prisma.jobPosting.findMany({
      where: {
        status: 'ACTIVE',
        deadline: {
          gte: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      jobs,
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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
      deadline 
    } = requestBody;
    
    // Validate required fields
    if (!title || !company || !location || !description || !deadline) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
        mbtiTypes,
        deadline: new Date(deadline),
        status: 'OPEN',
        adminId: decoded.id,
      },
    });
    
    return NextResponse.json({ message: 'Job created successfully', job });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 