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
