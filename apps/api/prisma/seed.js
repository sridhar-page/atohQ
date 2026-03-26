const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const dotenv = require('dotenv');

dotenv.config();

const libsqlConfig = {
  url: process.env.DATABASE_URL || 'file:./dev.db',
};

const adapter = new PrismaLibSql(libsqlConfig);
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log('Seeding...');

  // 1. Create Default Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'q-ease-main' },
    update: {},
    create: {
      name: 'Q-Ease Healthcare',
      slug: 'q-ease-main',
    },
  });

  console.log('Tenant created:', tenant.id);

  // 2. Create Default Queues
  const queues = [
    { name: 'General Medicine', description: 'OPD and general consultations' },
    { name: 'Dental Clinic', description: 'Appointments and cleanings' },
    { name: 'Pediatrics', description: 'Child healthcare and vaccinations' },
  ];

  for (const q of queues) {
    await prisma.queue.create({
      data: {
        name: q.name,
        description: q.description,
        tenantId: tenant.id,
        isActive: true,
      },
    });
  }

  console.log('Queues seeded.');

  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash('adminpassword', 10);

  // 3. Create Default Admin User
  await prisma.user.upsert({
    where: { email: 'admin@qease.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@qease.com',
      password: hashedPassword,
      name: 'Dr. Admin',
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  });

  console.log('Admin user seeded.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
