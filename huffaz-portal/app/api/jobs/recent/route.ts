import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';

export async function GET() {
  try {
    const jobs = await prisma.jobPosting.findMany({
      where: {
        status: 'ACTIVE',
        deadline: {
          gte: new Date(),
        },
      },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        mbtiTypes: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    return NextResponse.json({
      jobs,
    });
  } catch (error) {
    console.error('Get recent jobs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 