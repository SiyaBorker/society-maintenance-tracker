// Creates one admin account and one demo resident account so the app is
// usable immediately after deploy, without needing the ADMIN_SIGNUP_CODE
// flow. Safe to run multiple times (upserts on email).
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
  const residentPassword = process.env.SEED_RESIDENT_PASSWORD || 'Resident@123';

  const adminHash = await bcrypt.hash(adminPassword, 10);
  const residentHash = await bcrypt.hash(residentPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@society.test' },
    update: {},
    create: {
      name: 'Society Admin',
      email: 'admin@society.test',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });

  const resident = await prisma.user.upsert({
    where: { email: 'resident@society.test' },
    update: {},
    create: {
      name: 'Demo Resident',
      email: 'resident@society.test',
      passwordHash: residentHash,
      role: 'RESIDENT',
      flatNumber: 'A-101',
    },
  });

  await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, overdueThresholdDays: 7 },
  });

  console.log('Seed complete:');
  console.log(`  Admin    -> email: ${admin.email}    password: ${adminPassword}`);
  console.log(`  Resident -> email: ${resident.email} password: ${residentPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
