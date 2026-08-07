import { prisma } from './src/services/db';

async function main() {
  const recurring = await prisma.recurringExpense.findMany({
    where: { title: { contains: 'Apartamento' } }
  });
  console.log('Recurring Expenses:', recurring);

  const transactions = await prisma.transaction.findMany({
    where: { description: { contains: 'caixa', mode: 'insensitive' } }
  });
  console.log('Transactions:', transactions);
}

main().catch(console.error).finally(() => prisma.$disconnect());
