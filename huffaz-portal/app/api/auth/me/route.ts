import { NextRequest, NextResponse } from 'next/server'; // Import NextRequest
import prisma from '@/app/lib/db';
import { getCurrentUser, verifyToken, getTokenFromCookies } from '@/app/lib/auth'; // Import necessary functions

export async function GET(request: NextRequest) { // Accept request
  try {
    // Pass request to getTokenFromCookies
    const token = await getTokenFromCookies(request);
    if (!token) {
      // console.log('/api/auth/me: No token found'); // Debug log
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      // console.log('/api/auth/me: Invalid token'); // Debug log
      // Clear potentially invalid cookie
      const response = NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      response.cookies.delete('token');
      return response;
    }

    // console.log('/api/auth/me: Decoded token:', decoded); // Debug log

    const user = await prisma.user.findUnique({
      where: { id: decoded.id as string }, // Ensure id is treated as string
      include: {
        profile: true, // Include profile data
      },
    });

    if (!user) {
      // console.log('/api/auth/me: User not found in DB'); // Debug log
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove sensitive information before sending
    const { password, ...userWithoutPassword } = user;

    // console.log('/api/auth/me: Returning user:', userWithoutPassword); // Debug log
    return NextResponse.json({
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Get user info error (/api/auth/me):', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
