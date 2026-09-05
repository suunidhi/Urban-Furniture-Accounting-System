const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const cats = ['Electronic', 'Furniture', 'Daily Essential', 'Clothes', 'Utensils'];
  for (const c of cats) {
    const exists = await prisma.productCategory.findFirst({ where: { name: c } });
    if (!exists) {
      await prisma.productCategory.create({ data: { name: c } });
    }
  }
  console.log('Categories seeded!');
  await prisma.$disconnect();
}

seed();
