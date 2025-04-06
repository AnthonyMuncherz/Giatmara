import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getTokenFromCookies, verifyToken } from '@/app/lib/auth';

export async function GET() {
  try {
    // Test token functionality
    const token = await getTokenFromCookies();
    let tokenStatus = 'No token found';
    let decodedToken = null;
    
    if (token) {
      tokenStatus = 'Token found';
      decodedToken = verifyToken(token);
      
      if (decodedToken) {
        tokenStatus += ' (valid)';
      } else {
        tokenStatus += ' (invalid)';
      }
    }
    
    // Test database connection
    let dbStatus = 'Unknown';
    let userCount = 0;
    let jobCount = 0;
    let applicationCount = 0;
    let error = null;
    
    try {
      // Test user table
      userCount = await prisma.user.count();
      dbStatus = 'Connected';
      
      // Test job table
      jobCount = await prisma.jobPosting.count();
      
      // Test application table
      applicationCount = await prisma.application.count();
    } catch (dbError) {
      dbStatus = 'Error';
      error = dbError instanceof Error ? dbError.message : String(dbError);
    }
    
    return NextResponse.json({
      status: 'ok',
      time: new Date().toISOString(),
      database: {
        status: dbStatus,
        counts: {
          users: userCount,
          jobs: jobCount,
          applications: applicationCount
        },
        error: error
      },
      authentication: {
        tokenStatus,
        decodedToken: decodedToken ? {
          id: decodedToken.id,
          role: decodedToken.role,
          // Exclude sensitive information
          exp: decodedToken.exp
        } : null
      }
    });
  } catch (error) {
    console.error('Debug route error:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 