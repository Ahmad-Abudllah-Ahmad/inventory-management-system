const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const admin = await prisma.user.upsert({
      where: { id: 'admin-001' },
      update: {},
      create: {
        id: 'admin-001',
        email: 'admin@alumermobile.com',
        username: 'admin',
        password: 'hashed-password',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
      }
    });
    console.log("Upserted admin:", admin.id);
  } catch (err) {
    console.error("Failed to upsert admin: ", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
