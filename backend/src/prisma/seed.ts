import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Create Admin User ────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tenantmgmt.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@tenantmgmt.com',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`  ✓ Admin user: ${admin.email}`);

  // ── Create Manager User ──────────────────────────────
  const managerPassword = await bcrypt.hash('manager123', 12);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@tenantmgmt.com' },
    update: {},
    create: {
      name: 'Property Manager',
      email: 'manager@tenantmgmt.com',
      password: managerPassword,
      role: Role.MANAGER,
    },
  });
  console.log(`  ✓ Manager user: ${manager.email}`);

  // ── Create Collector User ────────────────────────────
  const collectorPassword = await bcrypt.hash('collector123', 12);
  const collector = await prisma.user.upsert({
    where: { email: 'collector@tenantmgmt.com' },
    update: {},
    create: {
      name: 'Rent Collector',
      email: 'collector@tenantmgmt.com',
      password: collectorPassword,
      role: Role.COLLECTOR,
    },
  });
  console.log(`  ✓ Collector user: ${collector.email}`);

  // ── Create Sample Property ───────────────────────────
  const property = await prisma.property.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Sunrise Apartments',
      address: '123 Main Street, Block A',
      ownerId: admin.id,
      managerId: manager.id,
    },
  });
  console.log(`  ✓ Property: ${property.name}`);

  // ── Create Sample Tenants ────────────────────────────
  const tenant1 = await prisma.tenant.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      name: 'Rahul Sharma',
      phone: '9876543210',
      propertyId: property.id,
      rentAmount: 15000,
      moveInDate: new Date('2025-01-15'),
    },
  });

  const tenant2 = await prisma.tenant.upsert({
    where: { id: '00000000-0000-0000-0000-000000000011' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000011',
      name: 'Priya Patel',
      phone: '9876543211',
      propertyId: property.id,
      rentAmount: 12000,
      moveInDate: new Date('2025-03-01'),
    },
  });
  console.log(`  ✓ Tenants: ${tenant1.name}, ${tenant2.name}`);

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📋 Login credentials:');
  console.log('   Admin:     admin@tenantmgmt.com / admin123');
  console.log('   Manager:   manager@tenantmgmt.com / manager123');
  console.log('   Collector: collector@tenantmgmt.com / collector123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
