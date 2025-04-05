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
    
    // Count all jobs created by this employer using adminId field
    const count = await prisma.jobPosting.count({
      where: {
        adminId: decoded.id as string
      }
    });
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error counting employer jobs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 