import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getTokenFromCookies, verifyToken } from '@/app/lib/auth';

// Define interface for JobPosting
interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string | null;
  description: string;
  requirements: string;
  responsibilities: string | null;
  benefits: string | null;
  employmentType: string | null;
  mbtiTypes: string | null;
  deadline: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  adminId: string;
}

// This endpoint will update all existing job postings to include the new fields
export async function POST(request: Request) {
  try {
    // Verify admin authentication
    const token = await getTokenFromCookies();
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get all job postings without the new fields
    const jobs = await prisma.jobPosting.findMany();
    
    // Update the jobs with default values for the new fields
    const updatePromises = jobs.map((job: JobPosting) => {
      // Generate sample responsibilities based on job requirements
      const responsibilities = generateResponsibilities(job.title, job.requirements);
      
      // Generate sample benefits based on job type
      const benefits = generateBenefits(job.title);
      
      // Determine employment type (default to full-time)
      const employmentType = job.title.toLowerCase().includes('part-time') ? 'Part-time' : 'Full-time';
      
      return prisma.jobPosting.update({
        where: { id: job.id },
        data: {
          responsibilities,
          benefits,
          employmentType,
        },
      });
    });
    
    // Execute all the updates
    await Promise.all(updatePromises);
    
    return NextResponse.json({ 
      message: 'Successfully updated all jobs with new fields',
      jobsUpdated: jobs.length,
    });
  } catch (error) {
    console.error('Error updating job fields:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Helper function to generate responsibilities based on job title and requirements
function generateResponsibilities(title: string, requirements: string): string {
  const commonResponsibilities = [
    'Collaborate with team members to achieve organizational goals',
    'Maintain accurate records and documentation',
    'Participate in regular training and professional development',
    'Adhere to company policies and procedures',
    'Contribute to a positive work environment',
  ];
  
  // Get some specific responsibilities based on job title
  let specificResponsibilities: string[] = [];
  
  if (title.toLowerCase().includes('instructor') || title.toLowerCase().includes('teacher')) {
    specificResponsibilities = [
      'Develop and deliver curriculum for students',
      'Assess student progress and provide constructive feedback',
      'Prepare teaching materials and resources',
      'Organize educational events and activities',
      'Maintain accurate records of student attendance and progress',
    ];
  } else if (title.toLowerCase().includes('engineer')) {
    specificResponsibilities = [
      'Design and implement technical solutions',
      'Troubleshoot and resolve technical issues',
      'Collaborate with cross-functional teams',
      'Stay updated with emerging technologies and trends',
      'Document technical specifications and processes',
    ];
  } else if (title.toLowerCase().includes('manager')) {
    specificResponsibilities = [
      'Lead and mentor team members',
      'Develop and implement strategic plans',
      'Monitor budget and control expenses',
      'Generate reports and analyze performance metrics',
      'Ensure compliance with regulations and standards',
    ];
  } else {
    // Extract keywords from requirements to generate custom responsibilities
    const keywords = requirements.toLowerCase().split(/\s+/);
    if (keywords.some(word => ['design', 'creative', 'graphics'].includes(word))) {
      specificResponsibilities = [
        'Create engaging visual content for various platforms',
        'Maintain brand consistency across all materials',
        'Collaborate with marketing team on campaign materials',
        'Stay current with design trends and techniques',
        'Develop innovative visual solutions for business needs',
      ];
    } else if (keywords.some(word => ['research', 'analysis', 'data'].includes(word))) {
      specificResponsibilities = [
        'Collect and analyze data to identify trends',
        'Prepare detailed reports and presentations',
        'Develop research methodologies and frameworks',
        'Make recommendations based on research findings',
        'Stay updated with latest research in the field',
      ];
    } else {
      specificResponsibilities = [
        'Execute tasks related to core job functions',
        'Complete assignments within established deadlines',
        'Report progress to supervisor on a regular basis',
        'Identify opportunities for process improvement',
        'Support organizational objectives and initiatives',
      ];
    }
  }
  
  return [...specificResponsibilities, ...commonResponsibilities].join('\n');
}

// Helper function to generate benefits based on job title
function generateBenefits(title: string): string {
  const commonBenefits = [
    'Medical and dental coverage',
    'Annual leave and public holidays',
    'Professional development opportunities',
    'Supportive work environment',
    'Career advancement possibilities',
  ];
  
  let specificBenefits: string[] = [];
  
  if (title.toLowerCase().includes('instructor') || title.toLowerCase().includes('teacher')) {
    specificBenefits = [
      'School holidays break',
      'Educational resources allowance',
      'Flexible teaching schedule',
      'Reduced workload during examination periods',
    ];
  } else if (title.toLowerCase().includes('engineer') || title.toLowerCase().includes('developer')) {
    specificBenefits = [
      'Latest technology and equipment',
      'Flexible working hours',
      'Remote work options',
      'Technical certification sponsorship',
    ];
  } else if (title.toLowerCase().includes('manager') || title.toLowerCase().includes('director')) {
    specificBenefits = [
      'Performance-based bonuses',
      'Leadership development programs',
      'Company phone and laptop',
      'Travel opportunities',
    ];
  } else {
    specificBenefits = [
      'Competitive salary package',
      'Performance incentives',
      'Work-life balance initiatives',
      'Employee wellness programs',
    ];
  }
  
  return [...specificBenefits, ...commonBenefits].join('\n');
} 