const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create employer user
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const employer = await prisma.user.upsert({
    where: { email: 'employer@example.com' },
    update: {},
    create: {
      email: 'employer@example.com',
      password: hashedPassword,
      role: 'EMPLOYER',
      profile: {
        create: {
          firstName: 'Employer',
          lastName: 'User',
          mbtiCompleted: true,
          mbtiType: 'ENTJ',
        },
      },
    },
  });

  // Create sample job postings for the employer
  const jobPostings = [
    {
      title: 'Senior Web Developer',
      company: 'Tech Solutions Malaysia',
      location: 'Kuala Lumpur',
      salary: 'RM 8,000 - RM 12,000',
      description: 'Lead web development team in creating and maintaining enterprise web applications. Implement best practices and mentor junior developers.',
      requirements: 'Bachelor\'s degree in Computer Science or related field. 5+ years experience with React, Node.js, and TypeScript. Strong leadership skills.',
      responsibilities: 'Lead web development projects from concept to completion\nArchitect scalable and maintainable web applications\nImplement modern development practices and CI/CD pipelines\nMentor junior developers and conduct code reviews\nCollaborate with product managers and designers\nOptimize application performance and security',
      benefits: 'Competitive salary package\nPerformance bonuses\nComprehensive health insurance\nRemote work options\nProfessional development fund\nStock options\nFlexible working hours',
      employmentType: 'Full-time',
      mbtiTypes: 'INTJ,ENTJ,INTP,ENTP',
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      adminId: employer.id,
    },
    {
      title: 'Islamic Finance Consultant',
      company: 'Halal Investment Partners',
      location: 'Selangor',
      salary: 'RM 7,000 - RM 10,000',
      description: 'Provide expert advice on Islamic finance principles and investment opportunities. Develop Shariah-compliant financial products and services.',
      requirements: 'Master\'s degree in Islamic Finance, Economics, or related field. Certification in Islamic Banking. 3+ years experience in financial consulting.',
      responsibilities: 'Advise clients on Shariah-compliant investments\nDevelop Islamic financial products and services\nEnsure compliance with Islamic finance principles\nConduct research on Islamic finance trends\nPresent investment opportunities to clients\nCollaborate with Shariah scholars on product validation',
      benefits: 'Performance-based bonuses\nComprehensive medical coverage\nProfessional development allowance\nRetirement savings plan\nPilgrimage leave\nFlexible working arrangements',
      employmentType: 'Full-time',
      mbtiTypes: 'ISTJ,INTJ,ESTJ,ENTJ',
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      adminId: employer.id,
    },
    {
      title: 'Quran Memorization Teacher',
      company: 'Darul Huffaz Academy',
      location: 'Penang',
      salary: 'RM 4,000 - RM 6,000',
      description: 'Guide students in memorizing the Quran using effective teaching methods. Provide individualized attention and track student progress.',
      requirements: 'Complete memorization of the Quran (Hafiz). Ijazah in Quran recitation. 2+ years experience teaching Quran memorization.',
      responsibilities: 'Teach Quran memorization techniques to students of all ages\nMonitor and evaluate student progress regularly\nProvide individualized attention and feedback\nOrganize Quran recitation competitions\nCommunicate with parents about student development\nDevelop engaging teaching materials and methods',
      benefits: 'Flexible teaching schedule\nPaid time off for religious holidays\nProfessional development workshops\nPerformance incentives\nTransportation allowance\nHealthcare benefits',
      employmentType: 'Full-time',
      mbtiTypes: 'ENFJ,INFJ,ESFJ,ISFJ',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      adminId: employer.id,
    }
  ];

  for (const job of jobPostings) {
    await prisma.jobPosting.create({
      data: job,
    });
  }

  console.log('Employer account and job postings created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 