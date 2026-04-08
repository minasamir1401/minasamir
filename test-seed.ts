import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'admin@vegecurity.com' },
    update: {},
    create: {
      email: 'admin@vegecurity.com',
      name: 'Admin User',
      password: 'password123', // In a real app this should be hashed
      role: 'CLIENT',
    },
  });

  const job = await prisma.job.create({
    data: {
      title: 'Fullstack Architect Needed',
      description: 'Building a high-end freelance platform for developers.',
      budget: 5000,
      clientId: user.id,
      technologies: 'React, Node, Prisma, Tailwind',
      status: 'OPEN',
    },
  });

  console.log('Seed successful:', { user, job });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
