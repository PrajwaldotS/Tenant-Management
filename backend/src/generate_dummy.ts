import { PrismaClient, RentStatus, PaymentMethod } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Adding dummy partial payments for testing...');

  // 1. Get tenants
  const tenants = await prisma.tenant.findMany();
  
  if (tenants.length < 2) {
    console.log('Not enough tenants exist. Please run seed first.');
    return;
  }

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    console.log('Admin not found');
    return;
  }

  // 2. Clear existing payments/rents for a clean slate
  await prisma.payment.deleteMany();
  await prisma.rent.deleteMany();

  // 3. Create Rents and Partial Payments
  const today = new Date();
  
  // Tenant 1: Partial payment
  const rent1 = await prisma.rent.create({
    data: {
      amount: tenants[0].rentAmount,
      dueDate: new Date(today.getFullYear(), today.getMonth(), 5),
      generatedMonth: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
      status: RentStatus.PARTIAL,
      tenantId: tenants[0].id,
      // @ts-ignore
      followUpDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3), // Follow up in 3 days
    }
  });

  await prisma.payment.create({
    data: {
      amount: Number(tenants[0].rentAmount) - 5000, // They paid 5000 less
      method: PaymentMethod.UPI,
      referenceId: 'UPI-DUMMY-01',
      tenantId: tenants[0].id,
      rentId: rent1.id,
      createdById: admin.id,
    }
  });
  console.log(`✓ Added partial payment for ${tenants[0].name}. (Owes 5000)`);

  // Tenant 2: Partial payment
  const rent2 = await prisma.rent.create({
    data: {
      amount: tenants[1].rentAmount,
      dueDate: new Date(today.getFullYear(), today.getMonth(), 5),
      generatedMonth: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
      status: RentStatus.PARTIAL,
      tenantId: tenants[1].id,
      // @ts-ignore
      followUpDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5), // Follow up in 5 days
    }
  });

  await prisma.payment.create({
    data: {
      amount: Number(tenants[1].rentAmount) - 15000, 
      method: PaymentMethod.CASH,
      tenantId: tenants[1].id,
      rentId: rent2.id,
      createdById: admin.id,
    }
  });
  console.log(`✓ Added partial payment for ${tenants[1].name}. (Owes 15000)`);

}

main()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
