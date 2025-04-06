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

    // First get all job IDs that belong to this employer
    const jobs = await prisma.jobPosting.findMany({
      where: {
        adminId: user.id as string
      },
      select: {
        id: true
      }
    });

    const jobIds = jobs.map(job => job.id);

    // Then count applications for those jobs (only PENDING ones)
    const count = await prisma.application.count({
      where: {
        jobPostingId: {
          in: jobIds
        },
        status: 'PENDING' // Count only pending applications for the dashboard card
      }
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error counting employer applications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
