const { PrismaClient } = require('@prisma/client');
process.env.DATABASE_URL="postgresql://postgres.iufkwywvkxwowtceslhh:MELx%2B%2FzLG%2BS7BHu@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true"

const prisma = new PrismaClient();

async function main() {
  try {
    const categories = await prisma.category.findMany();
    console.log("Success! Found categories: " + categories.length);
  } catch (err) {
    console.error("Failed on new URL: ", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
