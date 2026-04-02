import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo user
  const hashedPassword = await bcryptjs.hash('demo@123', 10);
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@vettly.com' },
    update: {},
    create: {
      email: 'demo@vettly.com',
      password: hashedPassword,
      name: 'Demo User',
    },
  });

  console.log('Created demo user:', demoUser.email);

  // Create demo project
  const demoProject = await prisma.project.create({
    data: {
      name: 'Q1 2026 Vendor RFP',
      description: 'Compliance validation for Q1 vendors',
      status: 'active',
      userId: demoUser.id,
    },
  });

  console.log('Created demo project:', demoProject.name);

  // Create demo RFP document
  const demoDocument = await prisma.rFPDocument.create({
    data: {
      filename: 'RFP_2026_Q1.pdf',
      fileSize: 1024000,
      pageCount: 15,
      projectId: demoProject.id,
    },
  });

  console.log('Created demo RFP document:', demoDocument.filename);

  // Create demo requirements
  const requirements = [
    'ISO 27001 certification required',
    'SOC 2 Type II compliance',
    '24/7 customer support availability',
    'Data backup and disaster recovery within 4 hours',
    'Encryption for data in transit and at rest',
  ];

  for (let i = 0; i < requirements.length; i++) {
    await prisma.extractedRequirement.create({
      data: {
        text: requirements[i],
        projectId: demoProject.id,
        documentId: demoDocument.id,
        category: 'Compliance',
        order: i,
      },
    });
  }

  console.log('Created demo requirements:', requirements.length);

  console.log('✅ Database seeding completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
