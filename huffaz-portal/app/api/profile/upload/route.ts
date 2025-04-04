import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import prisma from '@/app/lib/db';
import { getTokenFromCookies, verifyToken } from '@/app/lib/auth';

export async function POST(request: Request) {
  try {
    const token = await getTokenFromCookies();
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = {
      resume: ['.pdf', '.doc', '.docx'],
      certificate: ['.pdf', '.jpg', '.jpeg', '.png'],
    };

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes[type as keyof typeof allowedTypes].includes(fileExtension)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    try {
      await writeFile(join(uploadDir, 'test.txt'), '');
    } catch {
      // Create uploads directory if it doesn't exist
      const fs = require('fs/promises');
      await fs.mkdir(join(process.cwd(), 'public', 'uploads'), { recursive: true });
    }

    // Generate unique filename
    const uniqueFilename = `${type}-${decoded.id}-${Date.now()}${fileExtension}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file
    const filePath = join(uploadDir, uniqueFilename);
    await writeFile(filePath, buffer);

    // Update profile with file URL
    const fileUrl = `/uploads/${uniqueFilename}`;
    const updateData = type === 'resume'
      ? { resumeUrl: fileUrl }
      : { certificateUrl: fileUrl };

    const profile = await prisma.profile.update({
      where: {
        userId: decoded.id,
      },
      data: updateData,
    });

    return NextResponse.json({
      url: fileUrl,
      profile,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 