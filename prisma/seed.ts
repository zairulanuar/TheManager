import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)

  // 0. Create Roles
  const roles = [
      { name: "Super Admin", key: "super_admin", type: 'SUPER_ADMIN', description: "Full system access", isSystem: true },
      { name: "Owner", key: "owner", type: 'OWNER', description: "Tenant owner", isSystem: true },
      { name: "Admin", key: "admin", type: 'ADMIN', description: "Tenant administrator", isSystem: true },
      { name: "User", key: "user", type: 'USER', description: "Standard user", isSystem: true },
  ];

  for (const role of roles) {
      await prisma.role.upsert({
          where: { key: role.key },
          update: {},
          create: {
              name: role.name,
              key: role.key,
              type: role.type as any,
              description: role.description,
              isSystem: role.isSystem
          }
      });
  }

  const superAdminRole = await prisma.role.findUnique({ where: { key: 'super_admin' } });

  // 1. Create the System Account
  const systemAccount = await prisma.account.upsert({
    where: { slug: 'system' },
    update: {},
    create: {
      name: 'System Admin Group',
      slug: 'system',
      companyLimit: 999,
      userLimit: 999,
    },
  })

  // 2. Create the Super Admin User
  await prisma.user.upsert({
    where: { email: 'admin@themanager.com' },
    update: {},
    create: {
      email: 'admin@themanager.com',
      password: hashedPassword,
      roleType: 'SUPER_ADMIN',
      roleId: superAdminRole?.id,
      accountId: systemAccount.id,
    },
  })

  console.log('✅ Super Admin created: admin@themanager.com / admin123')

  // 3. Seed Currencies
  const currencies = [
    { code: 'USD', name: 'United States Dollar', symbol: '$' },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  ];

  for (const currency of currencies) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: {},
      create: currency,
    });
  }
  console.log(`✅ Seeded ${currencies.length} currencies`);
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
