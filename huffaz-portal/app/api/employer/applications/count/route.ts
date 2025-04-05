import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getTokenFromCookies, verifyToken } from '@/app/lib/auth';

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
    
    // First get all job IDs that belong to this employer
    const jobs = await prisma.jobPosting.findMany({
      where: {
        adminId: decoded.id as string
      },
      select: {
        id: true
      }
    });
    
    const jobIds = jobs.map(job => job.id);
    
    // Then count applications for those jobs
    const count = await prisma.application.count({
      where: {
        jobPostingId: {
          in: jobIds
        }
      }
    });
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error counting employer applications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 