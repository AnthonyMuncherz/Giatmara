import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getTokenFromCookies, verifyToken } from '@/app/lib/auth';

interface ApplicationDebug {
  id: string;
  status: string;
  createdAt: Date;
  userId: string;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Using await pattern with params to resolve warning
    const { id } = await Promise.resolve(params);
    const jobId = id;
    console.log(`Debug route checking job ID: ${jobId}`);
    
    // Verify authentication
    const token = await getTokenFromCookies();
    const decoded = token ? verifyToken(token) : null;
    
    // Check if job exists
    let jobExists = false;
    let job = null;
    let applications: ApplicationDebug[] = [];
    let jobError = null;
    let applicationsError = null;
    
    try {
      // Try to fetch the job
      job = await prisma.jobPosting.findUnique({
        where: { id: jobId },
        select: {
          id: true,
          title: true,
          company: true,
          adminId: true,
          status: true,
          _count: {
            select: {
              applications: true
            }
          }
        }
      });
      
      jobExists = !!job;
    } catch (error) {
      console.error('Error fetching job:', error);
      jobError = error instanceof Error ? error.message : String(error);
    }
    
    // Try to fetch applications for this job
    if (jobExists) {
      try {
        applications = await prisma.application.findMany({
          where: { jobPostingId: jobId },
          select: {
            id: true,
            status: true,
            createdAt: true,
            userId: true
          },
          take: 10 // Limit to 10 results
        });
      } catch (error) {
        console.error('Error fetching applications:', error);
        applicationsError = error instanceof Error ? error.message : String(error);
      }
    }
    
    return NextResponse.json({
      jobId,
      authentication: {
        hasToken: !!token,
        isValid: !!decoded,
        userId: decoded?.id,
        role: decoded?.role
      },
      job: {
        exists: jobExists,
        data: job,
        error: jobError
      },
      applications: {
        count: applications.length,
        data: applications,
        error: applicationsError
      }
    });
  } catch (error) {
    console.error('Job debug route error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 