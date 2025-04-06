import { NextRequest, NextResponse } from 'next/server'; // Import NextRequest
import prisma from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth'; // Use getCurrentUser

export async function GET(request: NextRequest) { // Accept request
  try {
    const user = await getCurrentUser(request); // Pass request

    if (!user || !user.id || user.role !== 'EMPLOYER') {
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Count all jobs created by this employer using adminId field
    const count = await prisma.jobPosting.count({
      where: {
        adminId: user.id as string,
        status: 'ACTIVE' // Count only active jobs for the dashboard card
      }
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error counting employer jobs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
