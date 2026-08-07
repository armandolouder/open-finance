import { prisma } from "./src/services/db.js";

async function check() {
  const txs = await prisma.transaction.findMany({
    where: {
      totalInstallments: { gt: 1 }
    }
  });
  console.log(`Found ${txs.length} transactions with totalInstallments > 1`);
  if (txs.length > 0) {
    txs.forEach(t => {
      console.log(`Date: ${t.date}, CC: ${t.creditCardId}, amount: ${t.amount}, inst: ${t.installmentNumber}/${t.totalInstallments}, desc: ${t.originalDescription}`);
    });
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
