import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { hashPassword } from '@/app/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, role = 'STUDENT' } = body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user and profile in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: role as 'STUDENT' | 'ADMIN',
        },
      });

      await tx.profile.create({
        data: {
          userId: newUser.id,
          firstName,
          lastName,
        },
      });

      return newUser;
    });

    return NextResponse.json({
      message: 'User created successfully',
      userId: user.id,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 